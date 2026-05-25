"use client";

import { useMemo, useState } from "react";
import {
	createOpeningRound,
	getInterviewSummary,
	type InterviewRound,
	type InterviewTopic,
	scoreInterviewAnswer,
} from "@/lib/interview-core";
import { parseResumeFile, supportedResumeFormats } from "@/lib/resume-file";

type InterviewMode = "practice" | "auto";

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
	shouldSwitchFocus?: boolean;
	switchReason?: string;
	error?: string;
};

const emptyResumeHint =
	"请粘贴真实简历，或上传 .txt / .md / .json / .docx 文件后开始真实面试。";

const modeOptions: Array<{
	value: InterviewMode;
	title: string;
	description: string;
}> = [
	{
		value: "practice",
		title: "练习模式",
		description: "允许手动切换追问点，适合慢慢打磨 STAR 表达。",
	},
	{
		value: "auto",
		title: "连贯追问模式",
		description: "由真实 AI 面试官主导深挖、切题和基础题穿插。",
	},
];

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

function getSavedAnswer(
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

export function InterviewTrainer() {
	const [mode, setMode] = useState<InterviewMode>("auto");
	const [position, setPosition] = useState("前端实习生");
	const [resumeText, setResumeText] = useState("");
	const [fileStatus, setFileStatus] = useState(emptyResumeHint);
	const [isParsingFile, setIsParsingFile] = useState(false);
	const [isPreparing, setIsPreparing] = useState(false);
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

	const round = rounds[activeQuestion];
	const currentScore = scoreInterviewAnswer(answer, activeQuestion);
	const averageScore = useMemo(() => {
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
	}, [answer, currentScore.total, history, isCompleted]);

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

	async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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

	async function requestJson<T>(payload: Record<string, unknown>): Promise<T> {
		const response = await fetch("/api/interview-ai", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const data = (await response.json()) as T & { error?: string };

		if (!response.ok) {
			throw new Error(data.error || "真实 AI 请求失败，请检查模型配置。 ");
		}

		return data;
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

	async function getNextRound(): Promise<RoundResponse> {
		if (!round) {
			throw new Error("请先开始真实面试。 ");
		}

		const nextTopicIndex = getNextTopicIndex(currentTopicIndex, topics, rounds);
		const nextTopic = topics[nextTopicIndex];
		const answeredHistory = rounds
			.slice(0, activeQuestion + 1)
			.map((item, index) => ({
				focus: item.focus,
				question: item.question,
				answer: getSavedAnswer(history, activeQuestion, answer, index),
			}));

		return requestJson<RoundResponse>({
			action: "round",
			resumeText,
			position,
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
	}

	async function advanceToNextRound() {
		const nextIndex = activeQuestion + 1;

		if (
			mode === "auto" &&
			topicDepth >= autoModeMaxDepth &&
			topics.length > 0
		) {
			const nextTopicIndex = getNextTopicIndex(
				currentTopicIndex,
				topics,
				rounds,
			);
			const nextRound = createOpeningRound(topics[nextTopicIndex]);

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
			setCurrentTopicIndex(nextTopicIndex);
			setTopicDepth(0);
			setAnswer("");
			return;
		}

		const next = await getNextRound();

		if (!next.round) {
			throw new Error(next.error || "真实 AI 没有返回下一轮追问。 ");
		}

		setHistory((items) => [...items.slice(0, activeQuestion), answer]);
		setRounds((items) => {
			const nextItems = [...items];
			nextItems[nextIndex] = next.round as InterviewRound;
			return nextItems;
		});
		setActiveQuestion(nextIndex);

		if (next.shouldSwitchFocus || next.round.focus !== round?.focus) {
			setCurrentTopicIndex(findTopicIndexByFocus(topics, next.round.focus));
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
		const nextTopicIndex = getNextTopicIndex(currentTopicIndex, topics, rounds);
		const nextRound = createOpeningRound(topics[nextTopicIndex]);

		if (answer.trim().length > 0) {
			setHistory((items) => [...items.slice(0, activeQuestion), answer]);
		}

		setRounds((items) => {
			const nextItems = [...items];
			nextItems[nextIndex] = nextRound;
			return nextItems;
		});
		setCurrentTopicIndex(nextTopicIndex);
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

	function handleFinishInterview() {
		if (isAdvancing) {
			return;
		}

		if (answer.trim().length > 0 && !isCompleted) {
			setHistory((items) => [...items.slice(0, activeQuestion), answer]);
		}

		setIsCompleted(true);
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
		setPlanSummary("尚未基于简历生成面试计划。 ");
		setErrorMessage("");
	}

	const reportEntries = visibleRounds.map((item, index) => {
		const savedAnswer = getSavedAnswer(history, activeQuestion, answer, index);

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

	return (
		<div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
			<article className="rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-6">
				<div className="mb-6 grid gap-3 sm:grid-cols-2">
					{modeOptions.map((item) => {
						const isSelected = item.value === mode;

						return (
							<button
								key={item.value}
								type="button"
								onClick={() => setMode(item.value)}
								className={`rounded-3xl border p-4 text-left transition-all ${
									isSelected
										? "border-cyan-300/60 bg-cyan-300/15 shadow-[0_18px_50px_rgba(34,211,238,0.12)]"
										: "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
								}`}
							>
								<span className="flex items-center gap-2 text-sm font-semibold text-white">
									<span
										className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-cyan-200" : "bg-slate-500"}`}
									/>
									{item.title}
								</span>
								<span className="mt-2 block text-xs leading-6 text-slate-300">
									{item.description}
								</span>
							</button>
						);
					})}
				</div>

				<div className="mb-6 rounded-3xl border border-white/10 bg-slate-950/55 p-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<label
								htmlFor="resume-context"
								className="text-sm font-medium text-slate-200"
							>
								真实简历内容
							</label>
							<p className="mt-2 text-xs leading-5 text-slate-400">
								支持格式：{supportedResumeFormats.join(" / ")}。PDF
								请复制文本后粘贴；真实面试模式不使用 Mock 兜底。
							</p>
						</div>
						<label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/15">
							{isParsingFile ? "解析中..." : "上传简历文件"}
							<input
								type="file"
								accept=".txt,.md,.json,.docx,.pdf,.doc"
								className="sr-only"
								onChange={handleFileChange}
								disabled={isParsingFile}
							/>
						</label>
					</div>
					<textarea
						id="resume-context"
						value={resumeText}
						onChange={(event) => setResumeText(event.target.value)}
						className="mt-3 h-40 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/50"
						placeholder="粘贴真实简历内容，或上传文件后开始真实面试。"
					/>
					<div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.7fr_auto]">
						<input
							value={position}
							onChange={(event) => setPosition(event.target.value)}
							className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
							placeholder="目标岗位，例如：前端实习生"
						/>
						<div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs leading-5 text-slate-400">
							<p>{fileStatus}</p>
							<p>当前字数：{resumeText.length}</p>
						</div>
						<button
							type="button"
							onClick={handlePrepareInterview}
							disabled={!canStartInterview}
							className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:translate-y-0"
						>
							{isPreparing ? "真实 AI 解析中..." : "解析简历并开始"}
						</button>
					</div>
				</div>

				{errorMessage ? (
					<div className="mb-5 rounded-3xl border border-red-300/25 bg-red-300/10 p-4 text-sm leading-6 text-red-100">
						{errorMessage}
					</div>
				) : null}

				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
							当前追问点 · {round?.focus ?? "等待真实简历解析"}
						</p>
						<h2 className="mt-3 text-2xl font-semibold text-white">
							{round?.question ??
								"上传或粘贴真实简历后，真实 AI 会先解析项目/实习/技能线索，再开始一面追问。"}
						</h2>
					</div>
					<span className="w-fit rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
						当前点已追问 {topicDepth} 次
					</span>
				</div>
				<div className="mt-4 flex flex-wrap gap-2 text-xs">
					<span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-emerald-100">
						追问来源：真实 AI
					</span>
					<span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100">
						基础/八股已生成 {generatedFundamentalCount} 轮，已回答{" "}
						{fundamentalCount} 轮
					</span>
					<span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
						不使用 Mock 接口或硬编码候选人画像
					</span>
				</div>

				<div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
					<label
						htmlFor="answer"
						className="text-sm font-medium text-slate-200"
					>
						我的回答
					</label>
					<textarea
						id="answer"
						value={answer}
						onChange={(event) => setAnswer(event.target.value)}
						className="mt-3 min-h-44 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/50"
						placeholder="按真实面试回答：背景、个人职责、技术取舍、边界情况、验证结果。"
					/>
				</div>

				<div className="mt-5 grid gap-3 md:grid-cols-2">
					<div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
						<p className="font-semibold text-amber-200">面试官追问</p>
						<p className="mt-2">
							{round?.followUp ?? "开始后这里会显示真实 AI 的继续追问。"}
						</p>
					</div>
					<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
						<p className="font-semibold text-white">即时反馈</p>
						<p className="mt-2">{round?.feedback ?? planSummary}</p>
					</div>
				</div>

				<section className="mt-4 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.08] p-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
								Quality Guardrail
							</p>
							<h3 className="mt-2 text-lg font-semibold text-white">
								真实追问质量校准
							</h3>
						</div>
						<span className="w-fit rounded-full border border-cyan-300/30 bg-slate-950/40 px-3 py-1 text-xs text-cyan-100">
							不是随机追问
						</span>
					</div>
					<div className="mt-4 grid gap-3 lg:grid-cols-3">
						<div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
							<p className="font-semibold text-cyan-100">触发依据</p>
							<p className="mt-2">{round?.trigger ?? "等待真实简历解析。"}</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
							<p className="font-semibold text-cyan-100">考察维度</p>
							<p className="mt-2">
								{round?.dimension ?? "项目/实习/岗位基础能力"}
							</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
							<p className="font-semibold text-cyan-100">合格标准</p>
							<p className="mt-2">
								{round?.answerStandard ??
									"合格回答需要来自真实简历，不能靠预设项目或 Mock 内容。"}
							</p>
						</div>
					</div>
				</section>

				<div className="mt-6 flex flex-col gap-3 sm:flex-row">
					<button
						type="button"
						onClick={handleAnswerSubmit}
						disabled={!canAdvance}
						className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:translate-y-0"
					>
						{isCompleted
							? "训练已完成"
							: isAdvancing
								? "真实 AI 正在追问..."
								: mode === "auto"
									? "提交回答，继续追问"
									: "继续追问"}
					</button>
					<button
						type="button"
						onClick={handleReset}
						className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
					>
						重置训练
					</button>
					{mode === "practice" ? (
						<button
							type="button"
							onClick={handleSwitchTopic}
							disabled={isAdvancing || isCompleted || topics.length === 0}
							className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-200/15 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/40 disabled:text-slate-500"
						>
							练习模式：手动切换追问点
						</button>
					) : (
						<span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-5 py-3 text-sm font-semibold text-cyan-100">
							连贯模式：AI 面试官自动判断切题
						</span>
					)}
					<button
						type="button"
						onClick={handleFinishInterview}
						disabled={isAdvancing || isCompleted || rounds.length === 0}
						className="rounded-full border border-amber-200/30 bg-amber-200/10 px-5 py-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-200/15 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/40 disabled:text-slate-500"
					>
						结束并生成报告
					</button>
				</div>

				<p className="mt-3 text-xs leading-6 text-cyan-100/75">
					真实面试模式不会使用 Mock 接口兜底；如果模型或 Key
					不可用，会直接提示配置问题，而不是生成假追问。
				</p>
			</article>

			<aside className="space-y-5">
				<section className="rounded-[32px] border border-amber-300/20 bg-amber-300/10 p-6 text-slate-50 shadow-[0_24px_80px_rgba(251,191,36,0.12)]">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
								Live Score
							</p>
							<div className="mt-2 text-5xl font-black text-amber-100">
								{averageScore}
							</div>
						</div>
						<div className="text-right text-sm text-amber-50/80">
							<p>
								{isCompleted
									? "已生成复盘"
									: round
										? "逻辑边界内追问"
										: "等待开始"}
							</p>
							<p>已追问 {completedCount} 次</p>
						</div>
					</div>
					<div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-950/60">
						<div
							className="h-full rounded-full bg-amber-200 transition-all"
							style={{ width: `${inquiryDepth}%` }}
						/>
					</div>
					<p className="mt-5 text-sm leading-7 text-amber-50/90">{summary}</p>
				</section>

				<section className="rounded-[28px] border border-white/10 bg-slate-950/75 p-5">
					<h2 className="text-lg font-semibold text-white">复盘报告</h2>
					<div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
						<p>• 强项：能围绕项目场景说明技术取舍。</p>
						<p>• 短板：需要继续补充异常分支、性能指标和架构演进。</p>
						<p>• 下一步：把每个回答整理成 STAR 结构，并准备 2 个边界场景。</p>
					</div>
					<div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
						<span>技术准确性：{currentScore.accuracy}</span>
						<span>表达结构：{currentScore.structure}</span>
						<span>项目深度：{currentScore.depth}</span>
						<span>异常边界：{currentScore.riskHandling}</span>
						<span>基础/八股：{fundamentalCount} 轮</span>
						<span>{mode === "auto" ? "自动切题" : "手动练习"}</span>
					</div>
					<textarea
						readOnly
						value={reportMarkdown}
						className="mt-4 h-36 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-6 text-slate-300 outline-none"
					/>
				</section>

				<section className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 p-5">
					<h2 className="text-lg font-semibold text-white">追问链</h2>
					<p className="mt-2 text-xs leading-5 text-cyan-100/75">
						追问点来自真实简历解析结果，并穿插目标岗位高频基础知识；连贯模式由
						AI 面试官按回答质量、追问深度和逻辑边界自动切题。
					</p>
					<div className="mt-4 space-y-3 text-sm text-slate-200">
						{visibleRounds.length === 0 ? (
							<p className="text-slate-400">尚未生成追问链。</p>
						) : null}
						{visibleRounds.map((item, index) => {
							const isActive = index === activeQuestion;
							const isDone = index < completedCount;

							return (
								<div
									key={item.id}
									className={`rounded-2xl border p-3 ${
										isActive
											? "border-amber-300/40 bg-amber-300/10"
											: isDone
												? "border-cyan-300/25 bg-cyan-300/10"
												: "border-white/10 bg-white/[0.03]"
									}`}
								>
									<div className="flex items-center justify-between gap-3">
										<span>
											追问 {index + 1} · {item.focus}
										</span>
										<span className="text-xs text-slate-400">
											{isDone ? "已记录" : isActive ? "进行中" : "已生成"}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			</aside>
		</div>
	);
}
