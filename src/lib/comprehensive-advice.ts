/**
 * 综合复盘引擎 —— 基于规则引擎模式（Fact Base + Rule Registration + Priority Evaluation）
 *
 * 设计模式：Production Rule System
 *   1. buildFactBase()  — 从 localStorage 收集所有维度数据，构造不可变 FactBase
 *   2. readinessRules   — 按优先级降序注册的 Readiness 判定规则，第一条匹配即为结果
 *   3. actionRules      — 按优先级升序注册的改进建议规则，所有匹配项均被收集
 *   4. evaluateReadiness / evaluateActions — 遍历规则数组执行 condition，输出结果
 *
 * 扩展方式：向 readinessRules / actionRules 数组追加新规则即可，无需改动 evaluate 逻辑。
 */

import { loadInterviewHistory } from "@/lib/storage";
import { loadResumeLines, getVersionsForLine, aggregateSuggestions } from "@/lib/resume-versions";
import { loadJson } from "@/components/coding/storage";
import type { CodingAttempt } from "@/components/coding/types";

const ATTEMPT_KEY = "acs_coding_attempts";

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

export type Readiness = "可以投递" | "基本准备好" | "需要继续打磨" | "建议先集中训练";

export type NextAction = {
	priority: number;
	action: string;
	category: "resume" | "interview" | "coding";
};

export type ComprehensiveAdvice = {
	readiness: Readiness;
	resumeScore: number | null;
	interviewAvg: number | null;
	codingPassRate: number | null;
	unresolvedCount: number;
	nextActions: NextAction[];
};

/** 规则引擎收集的事实基础 */
export type FactBase = {
	resumeScore: number | null;
	interviewAvg: number | null;
	codingPassRate: number | null;
	unresolvedCount: number;
	interviewCount: number;
	attemptCount: number;
	recentFailureIds: string[];
};

type RuleCategory = "resume" | "interview" | "coding";

/** 规则接口 — 每条规则都是 condition → action 的映射 */
export type ReadinessRule = {
	id: string;
	priority: number;
	condition: (facts: FactBase) => boolean;
	readiness: Readiness;
};

export type ActionRule = {
	id: string;
	priority: number;
	category: RuleCategory;
	condition: (facts: FactBase) => boolean;
	action: string | ((facts: FactBase) => string);
};

// ---------------------------------------------------------------------------
// Fact Base 构建
// ---------------------------------------------------------------------------

export function buildFactBase(): FactBase {
	const lines = loadResumeLines();
	const interviews = loadInterviewHistory();
	const attempts = loadJson<CodingAttempt[]>(ATTEMPT_KEY, []);

	let resumeScore: number | null = null;
	let unresolvedCount = 0;

	if (lines.length > 0) {
		const latestLine = lines[0];
		const versions = getVersionsForLine(latestLine.id);
		if (versions.length > 0) {
			const latest = versions[0];
			resumeScore = latest.scores.resumeReview
				?? latest.scores.jdMatch
				?? null;
		}
		unresolvedCount = aggregateSuggestions(latestLine.id).length;
	}

	let interviewAvg: number | null = null;
	if (interviews.length > 0) {
		const recent = interviews.slice(0, 3);
		interviewAvg = Math.round(
			recent.reduce((s, r) => s + r.averageScore, 0) / recent.length,
		);
	}

	let codingPassRate: number | null = null;
	if (attempts.length > 0) {
		const passed = attempts.filter((a) => a.success).length;
		codingPassRate = Math.round((passed / attempts.length) * 100);
	}

	const recentFailureIds = [
		...new Set(
			attempts.filter((a) => !a.success).slice(0, 3).map((a) => a.challengeId),
		),
	].slice(0, 2);

	return {
		resumeScore,
		interviewAvg,
		codingPassRate,
		unresolvedCount,
		interviewCount: interviews.length,
		attemptCount: attempts.length,
		recentFailureIds,
	};
}

// ---------------------------------------------------------------------------
// Readiness 规则注册（按 priority 降序，第一条匹配即为结果）
// ---------------------------------------------------------------------------

export const readinessRules: ReadinessRule[] = [
	{
		id: "no-data",
		priority: 100,
		condition: (f) => f.resumeScore === null && f.interviewAvg === null,
		readiness: "建议先集中训练",
	},
	{
		id: "can-deliver",
		priority: 90,
		condition: (f) => {
			const rs = f.resumeScore ?? -1;
			const ia = f.interviewAvg ?? -1;
			const cp = f.codingPassRate ?? -1;
			return rs >= 80 && ia >= 75 && cp >= 70;
		},
		readiness: "可以投递",
	},
	{
		id: "basic-ready",
		priority: 80,
		condition: (f) => {
			const rs = f.resumeScore ?? -1;
			const ia = f.interviewAvg ?? -1;
			return rs >= 70 && ia >= 65;
		},
		readiness: "基本准备好",
	},
	{
		id: "needs-polish",
		priority: 70,
		condition: (f) => {
			const rs = f.resumeScore ?? -1;
			const ia = f.interviewAvg ?? -1;
			return rs >= 60 || ia >= 55;
		},
		readiness: "需要继续打磨",
	},
	{
		id: "fallback",
		priority: 0,
		condition: () => true,
		readiness: "建议先集中训练",
	},
];

// ---------------------------------------------------------------------------
// Action 规则注册（所有匹配项均被收集，最终按 priority 升序排列）
// ---------------------------------------------------------------------------

export const actionRules: ActionRule[] = [
	{
		id: "resume-missing",
		priority: 1,
		category: "resume",
		condition: (f) => f.resumeScore === null,
		action: "先做一次简历诊断，了解当前简历质量",
	},
	{
		id: "resume-unresolved",
		priority: 1,
		category: "resume",
		condition: (f) => f.resumeScore !== null && f.unresolvedCount >= 3,
		action: (f) => `简历还有 ${f.unresolvedCount} 条改进建议未处理`,
	},
	{
		id: "resume-low-score",
		priority: 2,
		category: "resume",
		condition: (f) => f.resumeScore !== null && f.unresolvedCount < 3 && f.resumeScore < 70,
		action: "简历诊断分偏低，建议优化项目描述和量化成果",
	},
	{
		id: "interview-none",
		priority: 1,
		category: "interview",
		condition: (f) => f.interviewCount === 0,
		action: "至少完成一次完整模拟面试",
	},
	{
		id: "interview-low-avg",
		priority: 2,
		category: "interview",
		condition: (f) => f.interviewCount > 0 && f.interviewAvg !== null && f.interviewAvg < 65,
		action: "面试均分偏低，建议针对短板再练一轮",
	},
	{
		id: "coding-none",
		priority: 3,
		category: "coding",
		condition: (f) => f.attemptCount === 0,
		action: "开始手写题练习，建议每天 2-3 题",
	},
	{
		id: "coding-low-pass-rate",
		priority: 2,
		category: "coding",
		condition: (f) => f.attemptCount > 0 && f.codingPassRate !== null && f.codingPassRate < 50,
		action: "手写题通过率偏低，建议重点练习失败题目",
	},
	{
		id: "coding-recent-failures",
		priority: 3,
		category: "coding",
		condition: (f) =>
			f.attemptCount > 0 &&
			f.codingPassRate !== null &&
			f.codingPassRate < 50 &&
			f.recentFailureIds.length > 0,
		action: (f) => `最近失败题目：${f.recentFailureIds.join("、")}`,
	},
];

/** 默认兜底规则（无任何 actionRule 匹配时使用） */
const defaultAction: NextAction = {
	priority: 3,
	action: "训练状态良好，保持节奏继续练习",
	category: "interview",
};

// ---------------------------------------------------------------------------
// 规则引擎 — 评估逻辑
// ---------------------------------------------------------------------------

/** 按 priority 降序遍历 readinessRules，返回第一条匹配的 readiness */
function evaluateReadiness(facts: FactBase): Readiness {
	const sorted = [...readinessRules].sort((a, b) => b.priority - a.priority);
	for (const rule of sorted) {
		if (rule.condition(facts)) {
			return rule.readiness;
		}
	}
	return "建议先集中训练";
}

/** 遍历 actionRules 收集所有匹配项，按 priority 升序排列 */
function evaluateActions(facts: FactBase): NextAction[] {
	const matched: NextAction[] = [];

	for (const rule of actionRules) {
		if (rule.condition(facts)) {
			const actionText = typeof rule.action === "function"
				? rule.action(facts)
				: rule.action;
			matched.push({
				priority: rule.priority,
				action: actionText,
				category: rule.category,
			});
		}
	}

	if (matched.length === 0) {
		return [defaultAction];
	}

	return matched.sort((a, b) => a.priority - b.priority);
}

// ---------------------------------------------------------------------------
// 公共 API（签名和返回类型与原实现完全一致）
// ---------------------------------------------------------------------------

export function generateComprehensiveAdvice(): ComprehensiveAdvice {
	const facts = buildFactBase();

	return {
		readiness: evaluateReadiness(facts),
		resumeScore: facts.resumeScore,
		interviewAvg: facts.interviewAvg,
		codingPassRate: facts.codingPassRate,
		unresolvedCount: facts.unresolvedCount,
		nextActions: evaluateActions(facts),
	};
}
