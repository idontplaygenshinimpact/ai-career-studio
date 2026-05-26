"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	useInterviewStore,
	selectRound,
	selectLatestAiScore,
	selectCurrentScore,
	selectAverageScore,
	selectCompletedCount,
	selectInquiryDepth,
	selectSummary,
	selectCanStartInterview,
	selectCanAdvance,
	selectFundamentalCount,
	selectGeneratedFundamentalCount,
	selectReportMarkdown,
	type InterviewMode,
	type InterviewStore,
} from "@/stores/interview-store";
import { supportedResumeFormats } from "@/lib/resume-file";
import { ScoreBoard } from "@/components/interview/ScoreBoard";
import { ReviewPanel } from "@/components/interview/ReviewPanel";
import { QuestionChain } from "@/components/interview/QuestionChain";
import {
	interviewerProfiles,
	type InterviewerRole,
} from "@/data/interviewer-roles";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { codingChallenges, type CodingChallenge } from "@/data/coding-challenges";
import { CodeEditor } from "@/components/CodeEditor";
import { runInSandbox, type SandboxResult } from "@/lib/sandbox";

function matchCodingChallenge(question: string): CodingChallenge | null {
	if (!question) return null;
	const q = question.toLowerCase();
	for (const c of codingChallenges) {
		const keywords = c.title.toLowerCase().replace(/[()（）]/g, "").split(/[\s/|｜]+/).filter((w) => w.length > 1);
		if (keywords.some((kw) => q.includes(kw))) return c;
	}
	return null;
}

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
		description: "由 AI 面试官主导深挖、切题和基础题穿插。",
	},
];

export function InterviewTrainer() {
	const {
		mode,
		interviewerRole,
		position,
		resumeText,
		fileStatus,
		isParsingFile,
		isPreparing,
		planSummary,
		topics,
		topicDepth,
		answer,
		rounds,
		isAdvancing,
		isCompleted,
		errorMessage,
		isGeneratingReview,
		streamingReviewText,
		reviewData,
		activeQuestion,
	} = useInterviewStore(
		useShallow((s) => ({
			mode: s.mode,
			interviewerRole: s.interviewerRole,
			position: s.position,
			resumeText: s.resumeText,
			fileStatus: s.fileStatus,
			isParsingFile: s.isParsingFile,
			isPreparing: s.isPreparing,
			planSummary: s.planSummary,
			topics: s.topics,
			topicDepth: s.topicDepth,
			answer: s.answer,
			rounds: s.rounds,
			isAdvancing: s.isAdvancing,
			isCompleted: s.isCompleted,
			errorMessage: s.errorMessage,
			isGeneratingReview: s.isGeneratingReview,
			streamingReviewText: s.streamingReviewText,
			reviewData: s.reviewData,
			activeQuestion: s.activeQuestion,
		})),
	);

	const round = useInterviewStore(selectRound);
	const latestAiScore = useInterviewStore(selectLatestAiScore);
	const completedCount = useInterviewStore(selectCompletedCount);
	const canStartInterview = useInterviewStore(selectCanStartInterview);
	const canAdvance = useInterviewStore(selectCanAdvance);
	const fundamentalCount = useInterviewStore(selectFundamentalCount);
	const generatedFundamentalCount = useInterviewStore(
		selectGeneratedFundamentalCount,
	);

	const stateForDerived = useInterviewStore(
		useShallow((s: InterviewStore) => ({
			aiScores: s.aiScores,
			answer: s.answer,
			history: s.history,
			isCompleted: s.isCompleted,
			activeQuestion: s.activeQuestion,
			rounds: s.rounds,
			mode: s.mode,
			position: s.position,
			planSummary: s.planSummary,
			topicDepth: s.topicDepth,
		})),
	);

	const currentScore = useMemo(() => selectCurrentScore(stateForDerived as InterviewStore), [stateForDerived]);
	const averageScore = useMemo(() => selectAverageScore(stateForDerived as InterviewStore), [stateForDerived]);
	const inquiryDepth = useMemo(() => selectInquiryDepth(stateForDerived as InterviewStore), [stateForDerived]);
	const summary = useMemo(() => selectSummary(stateForDerived as InterviewStore), [stateForDerived]);
	const reportMarkdown = useMemo(() => selectReportMarkdown(stateForDerived as InterviewStore), [stateForDerived]);

	const setMode = useInterviewStore((s) => s.setMode);
	const setInterviewerRole = useInterviewStore((s) => s.setInterviewerRole);
	const setPosition = useInterviewStore((s) => s.setPosition);
	const setResumeText = useInterviewStore((s) => s.setResumeText);
	const setAnswer = useInterviewStore((s) => s.setAnswer);
	const handleFileChange = useInterviewStore((s) => s.handleFileChange);
	const handlePrepareInterview = useInterviewStore(
		(s) => s.handlePrepareInterview,
	);
	const handleAnswerSubmit = useInterviewStore((s) => s.handleAnswerSubmit);
	const handleSwitchTopic = useInterviewStore((s) => s.handleSwitchTopic);
	const handleFinishInterview = useInterviewStore(
		(s) => s.handleFinishInterview,
	);
	const handleReset = useInterviewStore((s) => s.handleReset);

	const [codeMode, setCodeMode] = useState(false);
	const [codeValue, setCodeValue] = useState("");
	const [codeSandboxResult, setCodeSandboxResult] = useState<SandboxResult | null>(null);
	const [isRunningCode, setIsRunningCode] = useState(false);

	const matchedChallenge = useMemo(
		() => matchCodingChallenge(round?.question ?? ""),
		[round?.question],
	);

	useEffect(() => {
		if (matchedChallenge) {
			setCodeMode(true);
			setCodeValue(matchedChallenge.skeleton);
			setCodeSandboxResult(null);
		} else {
			setCodeMode(false);
		}
	}, [matchedChallenge]);

	async function handleRunCode() {
		if (!matchedChallenge) return;
		setIsRunningCode(true);
		setCodeSandboxResult(null);
		try {
			const result = await runInSandbox(codeValue, matchedChallenge.testCode, matchedChallenge.skeleton);
			setCodeSandboxResult(result);
			const summary = result.success
				? `[代码运行] 全部通过 (${result.tests.length}/${result.tests.length})，耗时 ${result.duration}ms`
				: `[代码运行] 未通过 (${result.tests.filter((t) => t.passed).length}/${result.tests.length})${result.error ? "：" + result.error : ""}`;
			setAnswer(`${summary}\n\n\`\`\`js\n${codeValue}\n\`\`\``);
		} finally {
			setIsRunningCode(false);
		}
	}

	useEffect(() => {
		useInterviewStore.getState().initFromStorage();
	}, []);

	const handleSpeechTranscript = useCallback(
		(text: string) => {
			setAnswer((prev: string) => prev + text);
		},
		[setAnswer],
	);

	const speech = useSpeechRecognition(handleSpeechTranscript);

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

				<div className="mb-6 grid gap-3 sm:grid-cols-3">
					{(Object.values(interviewerProfiles) as Array<{ id: InterviewerRole; name: string; description: string }>).map((role) => {
						const isSelected = role.id === interviewerRole;

						return (
							<button
								key={role.id}
								type="button"
								onClick={() => setInterviewerRole(role.id)}
								className={`rounded-3xl border p-4 text-left transition-all ${
									isSelected
										? "border-amber-300/60 bg-amber-300/15 shadow-[0_18px_50px_rgba(251,191,36,0.12)]"
										: "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
								}`}
							>
								<span className="flex items-center gap-2 text-sm font-semibold text-white">
									<span
										className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-amber-200" : "bg-slate-500"}`}
									/>
									{role.name}
								</span>
								<span className="mt-2 block text-xs leading-6 text-slate-300">
									{role.description}
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
							简历内容
						</label>
						<p className="mt-2 text-xs leading-5 text-slate-400">
							支持格式：{supportedResumeFormats.join(" / ")}。
							</p>
						</div>
						<label aria-label="上传简历文件" className="inline-flex cursor-pointer items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/15">
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
						placeholder="粘贴简历内容，或上传文件后开始面试。"
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
							{isPreparing ? "AI 解析中..." : "解析简历并开始"}
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
							当前追问点 · {round?.focus ?? "等待简历解析"}
						</p>
						<h2 className="mt-3 text-2xl font-semibold text-white">
						{round?.question ??
							"上传或粘贴简历后，AI 会先解析项目/实习/技能线索，再开始一面追问。"}
						</h2>
					</div>
					<span className="w-fit rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
						当前点已追问 {topicDepth} 次
					</span>
				</div>
				<div className="mt-4 flex flex-wrap gap-2 text-xs">
					<span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-emerald-100">
						AI 驱动追问
					</span>
					<span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100">
						基础/八股已生成 {generatedFundamentalCount} 轮，已回答{" "}
						{fundamentalCount} 轮
					</span>
				</div>

				<div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
					<div className="flex items-center justify-between">
						<label htmlFor="answer" className="text-sm font-medium text-slate-200">
							{codeMode ? `代码作答 · ${matchedChallenge?.title ?? ""}` : "我的回答"}
						</label>
						{matchedChallenge ? (
							<button
								type="button"
								onClick={() => setCodeMode(!codeMode)}
								className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100 transition-colors hover:bg-emerald-300/15"
							>
								{codeMode ? "切换为文字回答" : "切换为代码编辑器"}
							</button>
						) : null}
					</div>
					{codeMode && matchedChallenge ? (
						<>
							<div className="mt-3">
								<CodeEditor value={codeValue} onChange={setCodeValue} />
							</div>
							<div className="mt-3 flex flex-wrap items-center gap-3">
								<button
									type="button"
									onClick={handleRunCode}
									disabled={isRunningCode}
									className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
								>
									{isRunningCode ? "运行中..." : "运行测试"}
								</button>
								{codeSandboxResult ? (
									<span className={`text-xs font-semibold ${codeSandboxResult.success ? "text-emerald-300" : "text-red-300"}`}>
										{codeSandboxResult.success
											? `全部通过 (${codeSandboxResult.tests.length} 项)`
											: `未通过 (${codeSandboxResult.tests.filter((t) => t.passed).length}/${codeSandboxResult.tests.length})`}
										{codeSandboxResult.error ? ` - ${codeSandboxResult.error}` : ""}
									</span>
								) : null}
								{codeSandboxResult?.perf ? (
									<span className="text-[10px] text-slate-500">
										{codeSandboxResult.perf.cpuTimeMs}ms CPU
										{codeSandboxResult.perf.heapEstimateKB > 0 ? ` · ${Math.round(codeSandboxResult.perf.heapEstimateKB / 1024)}MB` : ""}
										{codeSandboxResult.perf.timedOut ? " · 超时" : ""}
									</span>
								) : null}
							</div>
							{codeSandboxResult && codeSandboxResult.tests.length > 0 ? (
								<div className="mt-3 space-y-1">
									{codeSandboxResult.tests.map((test) => (
										<div
											key={test.label}
											className={`rounded-lg px-3 py-1.5 text-xs ${
												test.passed ? "bg-emerald-300/10 text-emerald-100" : "bg-red-300/10 text-red-100"
											}`}
										>
											{test.passed ? "\u2705" : "\u274c"} {test.label}
										</div>
									))}
								</div>
							) : null}
						</>
					) : (
						<>
							<textarea
								id="answer"
								value={answer}
								onChange={(event) => setAnswer(event.target.value)}
								className="mt-3 min-h-44 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/50"
								placeholder="按面试要求回答：背景、个人职责、技术取舍、边界情况、验证结果。"
							/>
							{speech.isSupported ? (
								<div className="mt-3 flex items-center gap-3">
									<button
										type="button"
										onClick={speech.isListening ? speech.stop : speech.start}
										aria-label={speech.isListening ? "停止语音识别" : "开始语音输入"}
										className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
											speech.isListening
												? "border border-red-300/40 bg-red-300/15 text-red-100 shadow-[0_0_20px_rgba(252,165,165,0.15)]"
												: "border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
										}`}
									>
										{speech.isListening ? "停止语音" : "语音输入"}
									</button>
									{speech.isListening ? (
										<span className="flex items-center gap-2 text-xs text-red-200">
											<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-400" />
											正在识别...
										</span>
									) : null}
									{speech.transcript && !speech.isListening ? (
										<span className="text-xs text-slate-400">语音已转文字</span>
									) : null}
								</div>
							) : null}
						</>
					)}
				</div>

				{round ? (
					<>
						<div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
							<p className="font-semibold text-white">即时反馈</p>
							<p className="mt-2">{round.feedback}</p>
						</div>

						<section className="mt-4 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.08] p-4">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
										Quality Guardrail
									</p>
									<h3 className="mt-2 text-lg font-semibold text-white">
										追问质量校准
									</h3>
								</div>
							</div>
							<div className="mt-4 grid gap-3 lg:grid-cols-3">
								<div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
									<p className="font-semibold text-cyan-100">触发依据</p>
									<p className="mt-2">{round.trigger}</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
									<p className="font-semibold text-cyan-100">考察维度</p>
									<p className="mt-2">{round.dimension}</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
									<p className="font-semibold text-cyan-100">合格标准</p>
									<p className="mt-2">{round.answerStandard}</p>
								</div>
							</div>
						</section>
					</>
				) : null}

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
								? "AI 正在追问..."
								: mode === "auto"
									? "提交回答，继续追问"
									: "继续追问"}
					</button>
					<button
						type="button"
						onClick={handleReset}
						className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
					>
						重置
					</button>
					{round ? (
						<>
							{mode === "practice" ? (
								<button
									type="button"
									onClick={handleSwitchTopic}
									disabled={isAdvancing || isCompleted || topics.length === 0}
									className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-200/15 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/40 disabled:text-slate-500"
								>
									切换追问点
								</button>
							) : null}
							<button
								type="button"
								onClick={handleFinishInterview}
								disabled={isAdvancing || isCompleted || rounds.length === 0}
								className="rounded-full border border-amber-200/30 bg-amber-200/10 px-5 py-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-200/15 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/40 disabled:text-slate-500"
							>
								结束并生成报告
							</button>
						</>
					) : null}
				</div>

			</article>

			<aside className="space-y-5">
				<ScoreBoard
					averageScore={averageScore}
					isCompleted={isCompleted}
					hasRound={Boolean(round)}
					isAiScore={Boolean(latestAiScore)}
					completedCount={completedCount}
					inquiryDepth={inquiryDepth}
					summary={summary}
				/>
				<ReviewPanel
					isGeneratingReview={isGeneratingReview}
					streamingReviewText={streamingReviewText}
					reviewData={reviewData}
					currentScore={currentScore}
					latestAiScore={latestAiScore}
					isAiScore={Boolean(latestAiScore)}
					fundamentalCount={fundamentalCount}
					mode={mode}
					reportMarkdown={reportMarkdown}
				/>
				<QuestionChain
					visibleRounds={rounds}
					activeQuestion={activeQuestion}
					completedCount={completedCount}
				/>
			</aside>
		</div>
	);
}
