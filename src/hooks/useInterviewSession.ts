import { useEffect, useMemo, useState } from "react";
import {
	createOpeningRound,
	getInterviewSummary,
	type AnswerScore,
	type InterviewRound,
	type InterviewTopic,
	scoreInterviewAnswer,
} from "@/lib/interview-core";
import { parseResumeFile } from "@/lib/resume-file";
import { loadSharedContext, saveInterviewRecord } from "@/lib/storage";
import { fetchWithAiHeaders } from "@/lib/fetch-ai";
import type { InterviewerRole } from "@/data/interviewer-roles";

export type InterviewMode = "practice" | "auto";

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

export type ReviewResponse = {
	ok?: boolean;
	overallComment?: string;
	strengths?: string[];
	weaknesses?: string[];
	nextSteps?: string[];
	interviewReadiness?: string;
	error?: string;
};

const emptyResumeHint =
	"请粘贴真实简历，或上传 .txt / .md / .json / .docx 文件后开始真实面试。";

const autoModeMaxDepth = 2;

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
	if (topics.length === 0) {
		return 0;
	}

	const covered = new Set(rounds.map((item) => item.focus));
	const coveredFundamentals = rounds.filter(
		(item) =>
			item.category === "fundamental" || item.id.startsWith("fundamental-"),
	).length;
	const answeredRounds = Math.max(0, rounds.length - 1);
	const shouldPrioritizeFundamental =
		answeredRounds >= 2 && coveredFundamentals < 10 && answeredRounds % 2 === 0;
	const normalizedCurrentIndex = currentIndex % topics.length;

	if (shouldPrioritizeFundamental) {
		for (let offset = 1; offset <= topics.length; offset += 1) {
			const candidateIndex = (normalizedCurrentIndex + offset) % topics.length;
			const candidate = topics[candidateIndex];

			if (
				(candidate.category === "fundamental" ||
					candidate.id.startsWith("fundamental-")) &&
				!covered.has(candidate.focus)
			) {
				return candidateIndex;
			}
		}
	}

	for (let offset = 1; offset <= topics.length; offset += 1) {
		const candidateIndex = (normalizedCurrentIndex + offset) % topics.length;
		const candidate = topics[candidateIndex];

		if (!covered.has(candidate.focus)) {
			return candidateIndex;
		}
	}

	return (normalizedCurrentIndex + 1) % topics.length;
}

function findTopicIndexByFocus(topics: InterviewTopic[], focus: string) {
	const index = topics.findIndex((topic) => topic.focus === focus);
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

export function useInterviewSession() {
	const [mode, setMode] = useState<InterviewMode>("auto");
	const [interviewerRole, setInterviewerRole] = useState<InterviewerRole>("gentle");
	const [position, setPosition] = useState("前端实习生");
	const [resumeText, setResumeText] = useState("");
	const [fileStatus, setFileStatus] = useState(emptyResumeHint);
	const [isParsingFile, setIsParsingFile] = useState(false);
	const [isPreparing, setIsPreparing] = useState(false);

	useEffect(() => {
		const ctx = loadSharedContext();
		if (ctx.resumeText) {
			setResumeText(ctx.resumeText);
			setFileStatus("已从简历诊断 / JD 匹配页自动加载简历内容。");
		}
		if (ctx.position) {
			setPosition(ctx.position);
		}
	}, []);
	const [planSummary, setPlanSummary] = useState("尚未基于简历生成面试计划。 ");
	const [topics, setTopics] = useState<InterviewTopic[]>([]);
	const [activeQuestion, setActiveQuestion] = useState(0);
	const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
	const [topicDepth, setTopicDepth] = useState(0);
	const [answer, setAnswer] = useState("");
	const [history, setHistory] = useState<string[]>([]);
	const [rounds, setRounds] = useState<InterviewRound[]>([]);
	const [isAdvancing, setIsAdvancing] = useState(false);
	const [isCompleted, setIsCompleted] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [aiScores, setAiScores] = useState<(AnswerScore | null)[]>([]);
	const [reviewData, setReviewData] = useState<ReviewResponse | null>(null);
	const [isGeneratingReview, setIsGeneratingReview] = useState(false);

	const round = rounds[activeQuestion];
	const latestAiScore = aiScores[aiScores.length - 1];
	const currentScore =
		latestAiScore || scoreInterviewAnswer(answer, activeQuestion);
	const averageScore = useMemo(() => {
		const validAiScores = aiScores.filter(
			(s): s is AnswerScore => s !== null,
		);

		if (validAiScores.length > 0) {
			const total = validAiScores.reduce((sum, s) => sum + s.total, 0);
			return Math.round(total / validAiScores.length);
		}

		const scoreInputs = isCompleted
			? history
			: [...history, answer].filter((item) => item.trim().length > 0);

		if (scoreInputs.length === 0) {
			return currentScore.total;
		}

		const total = scoreInputs.reduce(
			(sum, item, index) => sum + scoreInterviewAnswer(item, index).total,
			0,
		);
		return Math.round(total / scoreInputs.length);
	}, [aiScores, answer, currentScore.total, history, isCompleted]);

	const completedCount = history.length;
	const inquiryDepth = Math.min(100, Math.max(18, 18 + completedCount * 7));
	const summary = getInterviewSummary(averageScore);
	const canStartInterview =
		resumeText.trim().length >= 40 && !isPreparing && !isParsingFile;
	const canAdvance =
		Boolean(round) && answer.trim().length > 0 && !isAdvancing && !isCompleted;
	const visibleRounds = rounds;
	const answeredRounds = visibleRounds.filter(
		(_item, index) =>
			getSavedAnswer(history, activeQuestion, answer, index).trim().length > 0,
	);
	const fundamentalCount = answeredRounds.filter(isFundamentalRound).length;
	const generatedFundamentalCount =
		visibleRounds.filter(isFundamentalRound).length;

	async function requestJson<T>(payload: Record<string, unknown>): Promise<T> {
		const response = await fetchWithAiHeaders("/api/interview-ai", {
			method: "POST",
			body: JSON.stringify(payload),
		});

		const data = (await response.json()) as T & { error?: string };

		if (!response.ok) {
			throw new Error(data.error || "真实 AI 请求失败，请检查模型配置。 ");
		}

		return data;
	}

	async function handleFileChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		setIsParsingFile(true);
		setErrorMessage("");
		setFileStatus(`正在解析：${file.name}`);

		try {
			const result = await parseResumeFile(file);
			setResumeText(result.text);
			setFileStatus(result.message);
		} catch (error) {
			setFileStatus(
				error instanceof Error
					? error.message
					: "文件解析失败，请改为粘贴文本。 ",
			);
		} finally {
			setIsParsingFile(false);
			event.target.value = "";
		}
	}

	async function handlePrepareInterview() {
		if (!canStartInterview) {
			setErrorMessage("请先提供至少 40 字的真实简历内容，再开始面试。 ");
			return;
		}

		setIsPreparing(true);
		setErrorMessage("");
		setIsCompleted(false);

		try {
			const data = await requestJson<PlanResponse>({
				action: "plan",
				resumeText,
				position,
				interviewerRole,
			});

			if (!data.openingRound || !data.topics || data.topics.length === 0) {
				throw new Error("真实 AI 没有返回有效追问计划，请重试。 ");
			}

			setTopics(data.topics);
			setRounds([data.openingRound]);
			setCurrentTopicIndex(
				findTopicIndexByFocus(data.topics, data.openingRound.focus),
			);
			setActiveQuestion(0);
			setTopicDepth(0);
			setHistory([]);
			setAnswer("");
			setPlanSummary(data.summary || "已基于真实简历生成面试追问计划。 ");
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "真实 AI 初始化失败。 ",
			);
			setTopics([]);
			setRounds([]);
		} finally {
			setIsPreparing(false);
		}
	}

	async function advanceToNextRound() {
		const nextIndex = activeQuestion + 1;

		if (
			mode === "auto" &&
			topicDepth >= autoModeMaxDepth &&
			topics.length > 0
		) {
			const nextTopicIdx = getNextTopicIndex(
				currentTopicIndex,
				topics,
				rounds,
			);
			const nextRound = createOpeningRound(topics[nextTopicIdx]);

			setHistory((items) => [...items.slice(0, activeQuestion), answer]);
			setRounds((items) => {
				const nextItems = [...items];
				nextItems[nextIndex] = {
					...nextRound,
					trigger: `连贯追问模式由 AI 面试官控制节奏：当前点已追问 ${topicDepth + 1} 次，继续追问会重复或挤占基础题/其他项目考察，因此自动切换。`,
					switchReason:
						"连贯追问模式达到当前追问点的自动切换深度，由 AI 面试官切换到下一考察点。",
					shouldSwitchFocus: true,
				};
				return nextItems;
			});
			setActiveQuestion(nextIndex);
			setCurrentTopicIndex(nextTopicIdx);
			setTopicDepth(0);
			setAnswer("");
			return;
		}

		const nextTopicIdx = getNextTopicIndex(
			currentTopicIndex,
			topics,
			rounds,
		);
		const nextTopic = topics[nextTopicIdx];
		const answeredHistory = rounds
			.slice(0, activeQuestion + 1)
			.map((item, index) => ({
				focus: item.focus,
				question: item.question,
				answer: getSavedAnswer(history, activeQuestion, answer, index),
			}));

		const next = await requestJson<RoundResponse>({
			action: "round",
			resumeText,
			position,
			interviewerRole,
			mode,
			answer,
			currentRound: round,
			currentDepth: topicDepth,
			coveredFocuses: rounds
				.slice(0, activeQuestion + 1)
				.map((item) => item.focus),
			nextTopic,
			history: answeredHistory,
		});

		if (!next.round) {
			throw new Error(next.error || "真实 AI 没有返回下一轮追问。 ");
		}

		if (next.answerScore) {
			setAiScores((items) => [...items, next.answerScore as AnswerScore]);
		}

		setHistory((items) => [...items.slice(0, activeQuestion), answer]);
		setRounds((items) => {
			const nextItems = [...items];
			nextItems[nextIndex] = next.round as InterviewRound;
			return nextItems;
		});
		setActiveQuestion(nextIndex);

		if (next.shouldSwitchFocus || next.round.focus !== round?.focus) {
			setCurrentTopicIndex(
				findTopicIndexByFocus(topics, next.round.focus),
			);
			setTopicDepth(0);
		} else {
			setTopicDepth((depth) => depth + 1);
		}

		setAnswer("");
	}

	function handleSwitchTopic() {
		if (isAdvancing || isCompleted || topics.length === 0) {
			return;
		}

		const nextIndex = activeQuestion + 1;
		const nextTopicIdx = getNextTopicIndex(
			currentTopicIndex,
			topics,
			rounds,
		);
		const nextRound = createOpeningRound(topics[nextTopicIdx]);

		if (answer.trim().length > 0) {
			setHistory((items) => [...items.slice(0, activeQuestion), answer]);
		}

		setRounds((items) => {
			const nextItems = [...items];
			nextItems[nextIndex] = nextRound;
			return nextItems;
		});
		setCurrentTopicIndex(nextTopicIdx);
		setTopicDepth(0);
		setActiveQuestion(nextIndex);
		setAnswer("");
	}

	async function handleAnswerSubmit() {
		if (!canAdvance) {
			return;
		}

		setIsAdvancing(true);
		setErrorMessage("");

		try {
			if (mode === "practice") {
				await advanceToNextRound();
				return;
			}

			await new Promise((resolve) => window.setTimeout(resolve, 650));
			await advanceToNextRound();
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "真实 AI 追问失败。 ",
			);
		} finally {
			setIsAdvancing(false);
		}
	}

	async function handleFinishInterview() {
		if (isAdvancing || isGeneratingReview) {
			return;
		}

		const finalHistory =
			answer.trim().length > 0 && !isCompleted
				? [...history.slice(0, activeQuestion), answer]
				: history;

		if (answer.trim().length > 0 && !isCompleted) {
			setHistory(finalHistory);
		}

		setIsCompleted(true);
		setIsGeneratingReview(true);

		try {
			const reviewRounds = visibleRounds.map((item, index) => ({
				focus: item.focus,
				question: item.question,
				answer:
					getSavedAnswer(finalHistory, activeQuestion, answer, index) ||
					"（未作答）",
				dimension: item.dimension,
			}));

			const response = await requestJson<ReviewResponse>({
				action: "review",
				resumeText,
				position,
				mode,
				rounds: reviewRounds,
				averageScore,
			});

			setReviewData(response);

			saveInterviewRecord({
				id: `interview-${Date.now()}`,
				date: new Date().toISOString(),
				position,
				mode,
				averageScore,
				roundCount: visibleRounds.length,
				reportMarkdown,
				reviewSummary: response.overallComment || "",
			});
		} catch {
			setReviewData(null);
		} finally {
			setIsGeneratingReview(false);
		}
	}

	function handleReset() {
		setIsAdvancing(false);
		setIsCompleted(false);
		setActiveQuestion(0);
		setCurrentTopicIndex(0);
		setTopicDepth(0);
		setAnswer("");
		setHistory([]);
		setRounds([]);
		setTopics([]);
		setAiScores([]);
		setReviewData(null);
		setIsGeneratingReview(false);
		setPlanSummary("尚未基于简历生成面试计划。 ");
		setErrorMessage("");
	}

	const reportEntries = visibleRounds.map((item, index) => {
		const savedAnswer = getSavedAnswer(
			history,
			activeQuestion,
			answer,
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

	const reportMarkdown = `# AI Career Studio 真实模拟面试复盘\n\n综合评分：${averageScore}/100\n\n面试状态：${isCompleted ? "已结束" : round ? "进行中" : "未开始"}\n面试模式：${mode === "auto" ? "连贯追问模式（AI 面试官自动切题）" : "练习模式（允许手动切换追问点）"}\n已记录回答：${history.length} 轮\n已覆盖基础/八股：${fundamentalCount} 轮\n目标岗位：${position}\n当前追问点：${round?.focus ?? "未开始"}\n当前点追问深度：${topicDepth}\n\n## 简历解析摘要\n${planSummary}\n\n## 总体建议\n${summary}\n\n## 分项评分\n- 技术准确性：${currentScore.accuracy}\n- 表达结构：${currentScore.structure}\n- 项目深度：${currentScore.depth}\n- 异常边界：${currentScore.riskHandling}\n- 复盘意识：${currentScore.reviewMindset}\n\n## 逻辑边界说明\n本次真实模拟面试不使用硬编码候选人画像，也不使用 Mock 兜底；项目与经历追问点来自上传/粘贴的真实简历，基础八股根据目标岗位穿插。练习模式允许手动切换追问点；连贯追问模式由 AI 面试官主导深挖和切题，并以前端兜底限制保证同一追问点最多连续深挖 ${autoModeMaxDepth + 1} 轮，避免把项目深挖变成用户手动结束。\n\n## 完整追问轨迹\n${reportEntries.join("\n\n")}\n`;

	return {
		// State
		mode,
		interviewerRole,
		position,
		resumeText,
		fileStatus,
		isParsingFile,
		isPreparing,
		planSummary,
		topics,
		activeQuestion,
		topicDepth,
		answer,
		history,
		rounds,
		isAdvancing,
		isCompleted,
		errorMessage,
		reviewData,
		isGeneratingReview,

		// Derived
		round,
		latestAiScore,
		currentScore,
		averageScore,
		completedCount,
		inquiryDepth,
		summary,
		canStartInterview,
		canAdvance,
		visibleRounds,
		fundamentalCount,
		generatedFundamentalCount,
		reportMarkdown,

		// Setters
		setMode,
		setInterviewerRole,
		setPosition,
		setResumeText,
		setAnswer,

		// Handlers
		handleFileChange,
		handlePrepareInterview,
		handleAnswerSubmit,
		handleSwitchTopic,
		handleFinishInterview,
		handleReset,
	};
}
