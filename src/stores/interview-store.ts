import { create } from "zustand";
import {
	createOpeningRound,
	getInterviewSummary,
	type AnswerScore,
	type InterviewRound,
	type InterviewTopic,
	scoreInterviewAnswer,
} from "@/lib/interview-core";
import { parseResumeFile } from "@/lib/resume-file";
import {
	loadSharedContext,
	saveInterviewRecord,
	loadNextActions,
	clearNextActions,
} from "@/lib/storage";
import { fetchWithAiHeaders } from "@/lib/fetch-ai";
import { saveResumeVersion } from "@/lib/resume-versions";
import type { InterviewerRole } from "@/data/interviewer-roles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InterviewMode = "practice" | "auto";

export type ReviewResponse = {
	ok?: boolean;
	overallComment?: string;
	strengths?: string[];
	weaknesses?: string[];
	nextSteps?: string[];
	learningPaths?: string[];
	interviewReadiness?: string;
	error?: string;
};

type PlanResponse = {
	ok?: boolean;
	provider?: "real";
	summary?: string;
	topics?: InterviewTopic[];
	openingRound?: InterviewRound;
	error?: string;
};

type RoundResponse = {
	ok?: boolean;
	provider?: "real";
	round?: InterviewRound;
	answerScore?: AnswerScore;
	shouldSwitchFocus?: boolean;
	switchReason?: string;
	error?: string;
};

// ---------------------------------------------------------------------------
// Finite State Machine (FSM)
// ---------------------------------------------------------------------------
//
// 五阶段面试流程状态机。用 transitions map 显式声明每个状态的合法去向，
// 由 transitionTo 拦截非法转换，避免组件/action 通过拼接多个 boolean
// 推断状态时出现的"既在 preparing 又在 advancing"等不可能态。
//
//   idle ─► preparing ─► interviewing ─┬─► advancing ─┐
//                                       │              │
//                                       │◄─────────────┘
//                                       │
//                                       └─► reviewing ─► completed
//
// 任意状态都允许 → idle（reset 路径）。
// ---------------------------------------------------------------------------

export type InterviewPhase =
	| "idle"
	| "preparing"
	| "interviewing"
	| "advancing"
	| "reviewing"
	| "completed";

export const TRANSITIONS: Record<InterviewPhase, InterviewPhase[]> = {
	idle: ["preparing"],
	preparing: ["interviewing", "idle"],
	interviewing: ["advancing", "reviewing", "idle"],
	advancing: ["interviewing", "idle"],
	reviewing: ["completed", "idle"],
	completed: ["idle"],
};

/**
 * 校验并执行一次状态转换。
 *
 * @returns true 表示转换合法；false 表示非法（不会抛错，避免 UI 崩溃）。
 *          在开发环境会通过 console.warn 暴露非法转换，方便排查。
 */
export function transitionTo(from: InterviewPhase, to: InterviewPhase): boolean {
	if (from === to) return true;
	const allowed = TRANSITIONS[from] ?? [];
	if (!allowed.includes(to)) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				`[interview-store] Illegal phase transition: "${from}" -> "${to}". ` +
					`Allowed: [${allowed.join(", ") || "<none>"}]`,
			);
		}
		return false;
	}
	return true;
}

/**
 * 工具函数：判断当前是否处于给定阶段集合中的任意一个。
 * 用于组件做条件渲染时替代多个 boolean 的拼接判断。
 */
export function isInPhase(
	current: InterviewPhase,
	...phases: InterviewPhase[]
): boolean {
	return phases.includes(current);
}

// ---------------------------------------------------------------------------
// Slice: Session Config — 面试前的配置状态
// ---------------------------------------------------------------------------

type SessionConfigSlice = {
	mode: InterviewMode;
	interviewerRole: InterviewerRole;
	position: string;
	resumeText: string;
	fileStatus: string;
	isParsingFile: boolean;
	focusContext: string;
};

// ---------------------------------------------------------------------------
// Slice: Interview Progress — 面试进行中的动态状态
// ---------------------------------------------------------------------------

type InterviewProgressSlice = {
	phase: InterviewPhase;
	planSummary: string;
	topics: InterviewTopic[];
	activeQuestion: number;
	currentTopicIndex: number;
	topicDepth: number;
	answer: string;
	history: string[];
	rounds: InterviewRound[];
	errorMessage: string;
};

// ---------------------------------------------------------------------------
// Slice: Scoring — 评分相关
// ---------------------------------------------------------------------------

type ScoringSlice = {
	aiScores: (AnswerScore | null)[];
};

// ---------------------------------------------------------------------------
// Slice: Review — 复盘报告
// ---------------------------------------------------------------------------

type ReviewSlice = {
	reviewData: ReviewResponse | null;
	streamingReviewText: string;
};

// ---------------------------------------------------------------------------
// Combined State + Actions
// ---------------------------------------------------------------------------

type InterviewState = SessionConfigSlice &
	InterviewProgressSlice &
	ScoringSlice &
	ReviewSlice;

type InterviewActions = {
	// Session config setters
	setMode: (mode: InterviewMode) => void;
	setInterviewerRole: (role: InterviewerRole) => void;
	setPosition: (position: string) => void;
	setResumeText: (text: string) => void;
	setAnswer: (answerOrUpdater: string | ((prev: string) => string)) => void;

	// Lifecycle
	initFromStorage: () => void;
	handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
	handlePrepareInterview: () => Promise<void>;
	handleAnswerSubmit: () => Promise<void>;
	handleSwitchTopic: () => void;
	handleFinishInterview: () => Promise<void>;
	handleReset: () => void;
};

export type InterviewStore = InterviewState & InterviewActions;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_RESUME_HINT =
	"请粘贴真实简历，或上传 .txt / .md / .json / .docx 文件后开始真实面试。";
const AUTO_MODE_MAX_DEPTH = 3;

// ---------------------------------------------------------------------------
// Pure helpers (no store dependency)
// ---------------------------------------------------------------------------

function isFundamentalRound(
	item: Pick<InterviewRound, "category" | "id" | "focus">,
) {
	return (
		item.category === "fundamental" ||
		item.id.startsWith("fundamental-") ||
		item.focus.startsWith("基础：")
	);
}

function getNextTopicIndex(
	currentIndex: number,
	topics: InterviewTopic[],
	rounds: InterviewRound[],
) {
	if (topics.length === 0) return 0;

	const covered = new Set(rounds.map((r) => r.focus));
	const normalizedCurrentIndex = currentIndex % topics.length;

	const isFundamental = (r: Pick<InterviewRound, "category" | "id">) =>
		r.category === "fundamental" || r.id.startsWith("fundamental-");

	const resumeRounds = rounds.filter((r) => !isFundamental(r));
	const fundamentalRounds = rounds.filter(isFundamental);

	const distinctResumeFocuses = new Set(resumeRounds.map((r) => r.focus)).size;
	const distinctFundamentalFocuses = new Set(fundamentalRounds.map((r) => r.focus)).size;

	const recent5 = rounds.slice(-5);
	const allRecentResume = recent5.length >= 5 && recent5.every((r) => !isFundamental(r));
	const allRecentFundamental = recent5.length >= 5 && recent5.every(isFundamental);

	const findNext = (filterFn: (t: InterviewTopic) => boolean) => {
		for (let offset = 1; offset <= topics.length; offset += 1) {
			const idx = (normalizedCurrentIndex + offset) % topics.length;
			if (!covered.has(topics[idx].focus) && filterFn(topics[idx])) {
				return idx;
			}
		}
		return -1;
	};

	if (allRecentResume) {
		const idx = findNext(isFundamental);
		if (idx >= 0) return idx;
	}

	if (allRecentFundamental) {
		const idx = findNext((t) => !isFundamental(t));
		if (idx >= 0) return idx;
	}

	const isProjectPhase = distinctResumeFocuses < 5 && distinctFundamentalFocuses === 0;
	const needFundamentalBatch =
		!isProjectPhase &&
		(distinctFundamentalFocuses < distinctResumeFocuses * 0.8) &&
		(fundamentalRounds.length < 4 ||
		 (rounds.length > 0 &&
		  resumeRounds.length > 0 &&
		  rounds.slice(-3).every((r) => !isFundamental(r))));

	if (needFundamentalBatch) {
		const idx = findNext(isFundamental);
		if (idx >= 0) return idx;
	}

	if (isProjectPhase) {
		const idx = findNext((t) => !isFundamental(t));
		if (idx >= 0) return idx;
	}

	const anyIdx = findNext(() => true);
	if (anyIdx >= 0) return anyIdx;

	return (normalizedCurrentIndex + 1) % topics.length;
}

function findTopicIndexByFocus(topics: InterviewTopic[], focus: string) {
	const index = topics.findIndex((t) => t.focus === focus);
	return index >= 0 ? index : 0;
}

export function getSavedAnswer(
	history: string[],
	activeQuestion: number,
	answer: string,
	index: number,
) {
	return (
		history[index] ??
		(index === activeQuestion && answer.trim().length > 0 ? answer : "")
	);
}

async function requestJson<T>(
	payload: Record<string, unknown>,
	timeoutMs?: number,
): Promise<T> {
	const response = await fetchWithAiHeaders("/api/interview-ai", {
		method: "POST",
		body: JSON.stringify(payload),
		timeoutMs,
	});
	const data = (await response.json()) as T & { error?: string };
	if (!response.ok) {
		throw new Error(data.error || "真实 AI 请求失败，请检查模型配置。");
	}
	return data;
}

// ---------------------------------------------------------------------------
// Derived selectors (exported for components)
// ---------------------------------------------------------------------------

export function selectRound(state: InterviewState) {
	return state.rounds[state.activeQuestion] as InterviewRound | undefined;
}

export function selectLatestAiScore(state: InterviewState) {
	return state.aiScores[state.aiScores.length - 1];
}

export function selectCurrentScore(state: InterviewState) {
	const latestAi = selectLatestAiScore(state);
	return latestAi || scoreInterviewAnswer(state.answer, state.activeQuestion);
}

export function selectAverageScore(state: InterviewState) {
	const validAiScores = state.aiScores.filter(
		(s): s is AnswerScore => s !== null,
	);

	if (validAiScores.length > 0) {
		const total = validAiScores.reduce((sum, s) => sum + s.total, 0);
		return Math.round(total / validAiScores.length);
	}

	// "已结束面试"语义 = 已经在生成复盘 或 复盘已完成
	const finished = isInPhase(state.phase, "reviewing", "completed");
	const scoreInputs = finished
		? state.history
		: [...state.history, state.answer].filter((a) => a.trim().length > 0);

	if (scoreInputs.length === 0) {
		return selectCurrentScore(state).total;
	}

	const total = scoreInputs.reduce(
		(sum, item, i) => sum + scoreInterviewAnswer(item, i).total,
		0,
	);
	return Math.round(total / scoreInputs.length);
}

export function selectCompletedCount(state: InterviewState) {
	return state.history.length;
}

export function selectInquiryDepth(state: InterviewState) {
	const completed = selectCompletedCount(state);
	return Math.min(100, Math.max(18, 18 + completed * 7));
}

export function selectSummary(state: InterviewState) {
	return getInterviewSummary(selectAverageScore(state));
}

export function selectCanStartInterview(state: InterviewState) {
	return (
		state.resumeText.trim().length >= 40 &&
		state.phase !== "preparing" &&
		!state.isParsingFile
	);
}

export function selectCanAdvance(state: InterviewState) {
	const round = selectRound(state);
	return (
		Boolean(round) &&
		state.answer.trim().length > 0 &&
		state.phase === "interviewing"
	);
}

export function selectFundamentalCount(state: InterviewState) {
	const answeredRounds = state.rounds.filter(
		(_item, index) =>
			getSavedAnswer(
				state.history,
				state.activeQuestion,
				state.answer,
				index,
			).trim().length > 0,
	);
	return answeredRounds.filter(isFundamentalRound).length;
}

export function selectGeneratedFundamentalCount(state: InterviewState) {
	return state.rounds.filter(isFundamentalRound).length;
}

export function selectReportMarkdown(state: InterviewState) {
	const round = selectRound(state);
	const averageScore = selectAverageScore(state);
	const currentScore = selectCurrentScore(state);
	const fundamentalCount = selectFundamentalCount(state);
	const finished = isInPhase(state.phase, "reviewing", "completed");

	const reportEntries = state.rounds.map((item, index) => {
		const savedAnswer = getSavedAnswer(
			state.history,
			state.activeQuestion,
			state.answer,
			index,
		);
		return [
			`### 追问 ${index + 1}：${item.focus}`,
			`- 问题：${item.question}`,
			`- 考察维度：${item.dimension}`,
			`- 触发依据：${item.trigger}`,
			`- 合格标准：${item.answerStandard}`,
			`- 我的回答：${savedAnswer || "（未作答）"}`,
		].join("\n");
	});

	return `# AI Career Studio 真实模拟面试复盘\n\n综合评分：${averageScore}/100\n\n面试状态：${finished ? "已结束" : round ? "进行中" : "未开始"}\n面试模式：${state.mode === "auto" ? "连贯追问模式（AI 面试官自动切题）" : "练习模式（允许手动切换追问点）"}\n已记录回答：${state.history.length} 轮\n已覆盖基础/八股：${fundamentalCount} 轮\n目标岗位：${state.position}\n当前追问点：${round?.focus ?? "未开始"}\n当前点追问深度：${state.topicDepth}\n\n## 简历解析摘要\n${state.planSummary}\n\n## 总体建议\n${selectSummary(state)}\n\n## 分项评分\n- 技术准确性：${currentScore.accuracy}\n- 表达结构：${currentScore.structure}\n- 项目深度：${currentScore.depth}\n- 异常边界：${currentScore.riskHandling}\n- 复盘意识：${currentScore.reviewMindset}\n\n## 逻辑边界说明\n本次真实模拟面试不使用硬编码候选人画像，也不使用 Mock 兜底；项目与经历追问点来自上传/粘贴的真实简历，基础八股根据目标岗位穿插。练习模式允许手动切换追问点；连贯追问模式由 AI 面试官主导深挖和切题，并以前端兜底限制保证同一追问点最多连续深挖 ${AUTO_MODE_MAX_DEPTH + 1} 轮，避免把项目深挖变成用户手动结束。\n\n## 完整追问轨迹\n${reportEntries.join("\n\n")}\n`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useInterviewStore = create<InterviewStore>()((set, get) => {
	/**
	 * 内部包装：执行一次 FSM 状态转换并写入 store。
	 * 若转换非法则只 warn 不写入，确保 UI 不崩溃。
	 */
	const advancePhase = (
		to: InterviewPhase,
		extraPatch: Partial<InterviewState> = {},
	): boolean => {
		const from = get().phase;
		if (!transitionTo(from, to)) return false;
		set({ ...extraPatch, phase: to });
		return true;
	};

	return {
		// ── Session Config ──────────────────────────────────────────────────
		mode: "auto",
		interviewerRole: "gentle",
		position: "前端实习生",
		resumeText: "",
		fileStatus: EMPTY_RESUME_HINT,
		isParsingFile: false,
		focusContext: "",

		// ── Interview Progress ──────────────────────────────────────────────
		phase: "idle",
		planSummary: "尚未基于简历生成面试计划。",
		topics: [],
		activeQuestion: 0,
		currentTopicIndex: 0,
		topicDepth: 0,
		answer: "",
		history: [],
		rounds: [],
		errorMessage: "",

		// ── Scoring ─────────────────────────────────────────────────────────
		aiScores: [],

		// ── Review ──────────────────────────────────────────────────────────
		reviewData: null,
		streamingReviewText: "",

		// ── Session Config Actions ──────────────────────────────────────────
		setMode: (mode) => set({ mode }),
		setInterviewerRole: (role) => set({ interviewerRole: role }),
		setPosition: (position) => set({ position }),
		setResumeText: (text) => set({ resumeText: text }),
		setAnswer: (answerOrUpdater) =>
			set((state) => ({
				answer:
					typeof answerOrUpdater === "function"
						? answerOrUpdater(state.answer)
						: answerOrUpdater,
			})),

		// ── Lifecycle ───────────────────────────────────────────────────────

		initFromStorage: () => {
			const ctx = loadSharedContext();
			const patch: Partial<InterviewState> = {};
			if (ctx.resumeText) {
				patch.resumeText = ctx.resumeText;
				patch.fileStatus = "已从简历诊断 / JD 匹配页自动加载简历内容。";
			}
			if (ctx.position) {
				patch.position = ctx.position;
			}
			const actions = loadNextActions();
			const focus = actions.find((a) => a.type === "interview-focus");
			if (focus?.context) {
				patch.focusContext = focus.context;
			}
			clearNextActions();
			if (Object.keys(patch).length > 0) {
				set(patch);
			}
		},

		handleFileChange: async (event) => {
			const file = event.target.files?.[0];
			if (!file) return;

			set({ isParsingFile: true, errorMessage: "", fileStatus: `正在解析：${file.name}` });

			try {
				const result = await parseResumeFile(file);
				set({ resumeText: result.text, fileStatus: result.message });
			} catch (error) {
				set({
					fileStatus:
						error instanceof Error
							? error.message
							: "文件解析失败，请改为粘贴文本。",
				});
			} finally {
				set({ isParsingFile: false });
				event.target.value = "";
			}
		},

		handlePrepareInterview: async () => {
			const state = get();
			if (!selectCanStartInterview(state)) {
				set({ errorMessage: "请先提供至少 40 字的真实简历内容，再开始面试。" });
				return;
			}

			if (state.phase !== "idle") {
				advancePhase("idle");
			}
			if (!advancePhase("preparing", { errorMessage: "" })) {
				return;
			}

			try {
				const data = await requestJson<PlanResponse>({
					action: "plan",
					resumeText: state.resumeText,
					position: state.position,
					interviewerRole: state.interviewerRole,
					focusContext: state.focusContext || undefined,
				}, 90_000);

				if (!data.openingRound || !data.topics || data.topics.length === 0) {
					throw new Error("真实 AI 没有返回有效追问计划，请重试。");
				}

				advancePhase("interviewing", {
					topics: data.topics,
					rounds: [data.openingRound],
					currentTopicIndex: findTopicIndexByFocus(
						data.topics,
						data.openingRound.focus,
					),
					activeQuestion: 0,
					topicDepth: 0,
					history: [],
					answer: "",
					aiScores: [],
					reviewData: null,
					streamingReviewText: "",
					planSummary:
						data.summary || "已基于真实简历生成面试追问计划。",
				});
			} catch (error) {
				advancePhase("idle", {
					errorMessage:
						error instanceof Error
							? error.message
							: "真实 AI 初始化失败。",
					topics: [],
					rounds: [],
				});
			}
		},

		handleAnswerSubmit: async () => {
			const state = get();
			if (!selectCanAdvance(state)) return;

			if (!advancePhase("advancing", { errorMessage: "" })) return;

			try {
				await advanceToNextRound(get, set);
				advancePhase("interviewing");
			} catch (error) {
				advancePhase("interviewing", {
					errorMessage:
						error instanceof Error
							? error.message
							: "真实 AI 追问失败。",
				});
			}
		},

		handleSwitchTopic: () => {
			const state = get();
			if (state.phase !== "interviewing" || state.topics.length === 0) return;

			const nextIndex = state.activeQuestion + 1;
			const nextTopicIdx = getNextTopicIndex(
				state.currentTopicIndex,
				state.topics,
				state.rounds,
			);
			const nextRound = createOpeningRound(state.topics[nextTopicIdx]);

			const newHistory =
				state.answer.trim().length > 0
					? [...state.history.slice(0, state.activeQuestion), state.answer]
					: state.history;

			const newRounds = [...state.rounds];
			newRounds[nextIndex] = nextRound;

			set({
				history: newHistory,
				rounds: newRounds,
				currentTopicIndex: nextTopicIdx,
				topicDepth: 0,
				activeQuestion: nextIndex,
				answer: "",
			});
		},

		handleFinishInterview: async () => {
			const state = get();
			if (state.phase !== "interviewing") return;

			const finalHistory =
				state.answer.trim().length > 0
					? [
							...state.history.slice(0, state.activeQuestion),
							state.answer,
						]
					: state.history;

			if (state.answer.trim().length > 0) {
				set({ history: finalHistory });
			}

			if (!advancePhase("reviewing", { streamingReviewText: "" })) return;

			try {
				const current = get();
				const reviewRounds = current.rounds.map((item, index) => ({
					focus: item.focus,
					question: item.question,
					answer:
						getSavedAnswer(
							finalHistory,
							current.activeQuestion,
							current.answer,
							index,
						) || "（未作答）",
					dimension: item.dimension,
				}));

				const averageScore = selectAverageScore(current);

				const requestBody = {
					action: "review",
					stream: true,
					resumeText: current.resumeText,
					position: current.position,
					mode: current.mode,
					rounds: reviewRounds,
					averageScore,
				};

				let fullText = "";
				let retries = 0;
				const maxRetries = 2;

				const readStream = async () => {
					const streamResponse = await fetchWithAiHeaders(
						"/api/interview-ai",
						{
							method: "POST",
							body: JSON.stringify(requestBody),
							timeoutMs: 180_000,
						},
					);

					if (!streamResponse.ok) {
						throw new Error("复盘报告生成失败。");
					}

					const reader = streamResponse.body?.getReader();
					const decoder = new TextDecoder();

					if (reader) {
						while (true) {
							const { done, value } = await reader.read();
							if (done) break;
							const chunk = decoder.decode(value, { stream: true });
							fullText += chunk;
							set({ streamingReviewText: fullText });
						}
					}
				};

				while (retries <= maxRetries) {
					try {
						await readStream();
						break;
					} catch (err) {
						retries++;
						if (retries > maxRetries) throw err;
						const backoff = retries * 1000;
						set({ streamingReviewText: fullText + `\n\n[网络中断，${backoff / 1000}秒后重试...]` });
						await new Promise((r) => setTimeout(r, backoff));
					}
				}

				set({
					reviewData: {
						ok: true,
						overallComment: fullText,
						strengths: [],
						weaknesses: [],
						nextSteps: [],
						interviewReadiness: "",
					},
				});

				const afterReview = get();
				const currentScore = selectCurrentScore(afterReview);
				const reportMarkdown = selectReportMarkdown(afterReview);

				saveInterviewRecord({
					id: `interview-${Date.now()}`,
					date: new Date().toISOString(),
					position: afterReview.position,
					mode: afterReview.mode,
					averageScore: selectAverageScore(afterReview),
					roundCount: afterReview.rounds.length,
					reportMarkdown,
					reviewSummary: fullText.slice(0, 200),
					dimensions: {
						accuracy: currentScore.accuracy,
						structure: currentScore.structure,
						depth: currentScore.depth,
						riskHandling: currentScore.riskHandling,
						reviewMindset: currentScore.reviewMindset,
					},
				});

				if (afterReview.resumeText.trim().length >= 40) {
					saveResumeVersion({
						text: afterReview.resumeText,
						source: "mock-interview",
						scores: { interviewAvg: selectAverageScore(afterReview) },
						suggestions: extractWeaknesses(fullText).map((w) => ({
							source: "mock-interview" as const,
							content: w,
							priority: "medium" as const,
						})),
					});
				}
			} catch {
				set({ reviewData: null });
			} finally {
				advancePhase("completed");
			}
		},

		handleReset: () => {
			advancePhase("idle", {
				activeQuestion: 0,
				currentTopicIndex: 0,
				topicDepth: 0,
				answer: "",
				history: [],
				rounds: [],
				topics: [],
				aiScores: [],
				reviewData: null,
				streamingReviewText: "",
				planSummary: "尚未基于简历生成面试计划。",
				errorMessage: "",
			});
		},
	};
});

// ---------------------------------------------------------------------------
// Internal: advance logic (needs get/set)
// ---------------------------------------------------------------------------

/**
 * 从流式复盘报告文本中结构化提取短板/不足条目。
 *
 * 解析策略（按优先级）：
 *   1. 定位"短板"段落标题，提取该段下的列表项（- 或 • 开头）
 *   2. 若无列表项，提取段落标题到下一段标题之间的完整句子
 *   3. 最多返回 5 条，每条截断到 120 字
 */
function extractWeaknesses(text: string): string[] {
	const sectionHeaders = [
		/短板/,
		/不足/,
		/待改进/,
		/薄弱/,
		/需要提升/,
		/问题/,
	];

	const lines = text.split("\n");
	let inSection = false;
	const items: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();

		if (sectionHeaders.some((h) => h.test(trimmed)) && /^[#*\-•]|[：:]/.test(trimmed)) {
			inSection = true;
			continue;
		}

		if (inSection) {
			if (/^[#*]{1,3}\s/.test(trimmed) || /^(强项|优势|下一步|推荐|总体|学习方向)/.test(trimmed)) {
				inSection = false;
				continue;
			}

			const content = trimmed
				.replace(/^[-•*]\s*/, "")
				.replace(/^\d+[.、]\s*/, "");

			if (content.length >= 8) {
				items.push(content.slice(0, 120));
			}
		}
	}

	if (items.length > 0) {
		return items.slice(0, 5);
	}

	const fallbackPattern = /(?:短板|不足|薄弱|待改进)[：:]\s*(.+?)(?:[。；\n]|$)/g;
	const fallbackItems: string[] = [];
	let match;
	while ((match = fallbackPattern.exec(text)) !== null) {
		const content = match[1].trim();
		if (content.length >= 8) {
			fallbackItems.push(content.slice(0, 120));
		}
	}

	return fallbackItems.slice(0, 5);
}

async function advanceToNextRound(
	get: () => InterviewStore,
	set: (partial: Partial<InterviewState>) => void,
) {
	const state = get();
	const round = selectRound(state);
	const nextIndex = state.activeQuestion + 1;

	// Auto-mode depth guard: switch topic when max depth reached
	if (
		state.mode === "auto" &&
		state.topicDepth >= AUTO_MODE_MAX_DEPTH &&
		state.topics.length > 0
	) {
		const nextTopicIdx = getNextTopicIndex(
			state.currentTopicIndex,
			state.topics,
			state.rounds,
		);
		const nextRound = createOpeningRound(state.topics[nextTopicIdx]);

		const newHistory = [
			...state.history.slice(0, state.activeQuestion),
			state.answer,
		];
		const newRounds = [...state.rounds];
		newRounds[nextIndex] = {
			...nextRound,
			trigger: `连贯追问模式由 AI 面试官控制节奏：当前点已追问 ${state.topicDepth + 1} 次，继续追问会重复或挤占基础题/其他项目考察，因此自动切换。`,
			switchReason:
				"连贯追问模式达到当前追问点的自动切换深度，由 AI 面试官切换到下一考察点。",
			shouldSwitchFocus: true,
		};

		set({
			history: newHistory,
			rounds: newRounds,
			activeQuestion: nextIndex,
			currentTopicIndex: nextTopicIdx,
			topicDepth: 0,
			answer: "",
		});
		return;
	}

	// Normal advance: call AI for next round
	const nextTopicIdx = getNextTopicIndex(
		state.currentTopicIndex,
		state.topics,
		state.rounds,
	);
	const nextTopic = state.topics[nextTopicIdx];
	const answeredHistory = state.rounds
		.slice(0, state.activeQuestion + 1)
		.map((item, index) => ({
			focus: item.focus,
			question: item.question,
			answer: getSavedAnswer(
				state.history,
				state.activeQuestion,
				state.answer,
				index,
			),
		}));

	const next = await requestJson<RoundResponse>({
		action: "round",
		resumeText: state.resumeText,
		position: state.position,
		interviewerRole: state.interviewerRole,
		mode: state.mode,
		answer: state.answer,
		currentRound: round,
		currentDepth: state.topicDepth,
		coveredFocuses: state.rounds
			.slice(0, state.activeQuestion + 1)
			.map((item) => item.focus),
		nextTopic,
		history: answeredHistory,
	}, 90_000);

	if (!next.round) {
		throw new Error(next.error || "真实 AI 没有返回下一轮追问。");
	}

	const newHistory = [
		...state.history.slice(0, state.activeQuestion),
		state.answer,
	];
	const newRounds = [...state.rounds];
	newRounds[nextIndex] = next.round;

	const aiScores = next.answerScore
		? [...state.aiScores, next.answerScore]
		: state.aiScores;

	const switched =
		next.shouldSwitchFocus || next.round.focus !== round?.focus;

	set({
		aiScores,
		history: newHistory,
		rounds: newRounds,
		activeQuestion: nextIndex,
		currentTopicIndex: switched
			? findTopicIndexByFocus(state.topics, next.round.focus)
			: state.currentTopicIndex,
		topicDepth: switched ? 0 : state.topicDepth + 1,
		answer: "",
	});
}
