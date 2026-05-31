import { loadInterviewHistory } from "@/lib/storage";
import { loadResumeLines, getVersionsForLine, aggregateSuggestions } from "@/lib/resume-versions";
import { loadJson } from "@/components/coding/storage";
import type { CodingAttempt } from "@/components/coding/types";

const ATTEMPT_KEY = "acs_coding_attempts";

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

export function generateComprehensiveAdvice(): ComprehensiveAdvice {
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

	const readiness = calcReadiness(resumeScore, interviewAvg, codingPassRate);
	const nextActions = pickNextActions(
		resumeScore,
		interviewAvg,
		codingPassRate,
		unresolvedCount,
		interviews.length,
		attempts,
	);

	return {
		readiness,
		resumeScore,
		interviewAvg,
		codingPassRate,
		unresolvedCount,
		nextActions,
	};
}

function calcReadiness(
	resumeScore: number | null,
	interviewAvg: number | null,
	codingPassRate: number | null,
): Readiness {
	if (resumeScore === null && interviewAvg === null) return "建议先集中训练";

	const rs = resumeScore ?? -1;
	const ia = interviewAvg ?? -1;
	const cp = codingPassRate ?? -1;

	if (rs >= 80 && ia >= 75 && cp >= 70) return "可以投递";
	if (rs >= 70 && ia >= 65) return "基本准备好";
	if (rs >= 60 || ia >= 55) return "需要继续打磨";
	return "建议先集中训练";
}

function pickNextActions(
	resumeScore: number | null,
	interviewAvg: number | null,
	codingPassRate: number | null,
	unresolvedCount: number,
	interviewCount: number,
	attempts: CodingAttempt[],
): NextAction[] {
	const actions: NextAction[] = [];

	if (resumeScore === null) {
		actions.push({ priority: 1, action: "先做一次简历诊断，了解当前简历质量", category: "resume" });
	} else if (unresolvedCount >= 3) {
		actions.push({ priority: 1, action: `简历还有 ${unresolvedCount} 条改进建议未处理`, category: "resume" });
	} else if (resumeScore < 70) {
		actions.push({ priority: 2, action: "简历诊断分偏低，建议优化项目描述和量化成果", category: "resume" });
	}

	if (interviewCount === 0) {
		actions.push({ priority: 1, action: "至少完成一次完整模拟面试", category: "interview" });
	} else if (interviewAvg !== null && interviewAvg < 65) {
		actions.push({ priority: 2, action: "面试均分偏低，建议针对短板再练一轮", category: "interview" });
	}

	if (attempts.length === 0) {
		actions.push({ priority: 3, action: "开始手写题练习，建议每天 2-3 题", category: "coding" });
	} else if (codingPassRate !== null && codingPassRate < 50) {
		actions.push({ priority: 2, action: "手写题通过率偏低，建议重点练习失败题目", category: "coding" });

		const recentFailures = attempts
			.filter((a) => !a.success)
			.slice(0, 3);
		if (recentFailures.length > 0) {
			actions.push({
				priority: 3,
				action: `最近失败题目：${[...new Set(recentFailures.map((a) => a.challengeId))].slice(0, 2).join("、")}`,
				category: "coding",
			});
		}
	}

	if (actions.length === 0) {
		actions.push({ priority: 3, action: "训练状态良好，保持节奏继续练习", category: "interview" });
	}

	return actions.sort((a, b) => a.priority - b.priority);
}
