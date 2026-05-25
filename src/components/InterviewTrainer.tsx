"use client";

import { useCallback } from "react";
import {
	useInterviewSession,
	type InterviewMode,
} from "@/hooks/useInterviewSession";
import { supportedResumeFormats } from "@/lib/resume-file";
import { ScoreBoard } from "@/components/interview/ScoreBoard";
import { ReviewPanel } from "@/components/interview/ReviewPanel";
import { QuestionChain } from "@/components/interview/QuestionChain";
import {
	interviewerProfiles,
	type InterviewerRole,
} from "@/data/interviewer-roles";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

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

export function InterviewTrainer() {
	const session = useInterviewSession();

	const handleSpeechTranscript = useCallback(
		(text: string) => {
			session.setAnswer((prev: string) => prev + text);
		},
		[session],
	);

	const speech = useSpeechRecognition(handleSpeechTranscript);

	return (
		<div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
			<article className="rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-6">
				<div className="mb-6 grid gap-3 sm:grid-cols-2">
					{modeOptions.map((item) => {
						const isSelected = item.value === session.mode;

						return (
							<button
								key={item.value}
								type="button"
								onClick={() => session.setMode(item.value)}
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
						const isSelected = role.id === session.interviewerRole;

						return (
							<button
								key={role.id}
								type="button"
								onClick={() => session.setInterviewerRole(role.id)}
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
								真实简历内容
							</label>
							<p className="mt-2 text-xs leading-5 text-slate-400">
								支持格式：{supportedResumeFormats.join(" / ")}。PDF
								请复制文本后粘贴；真实面试模式不使用 Mock 兜底。
							</p>
						</div>
						<label aria-label="上传简历文件" className="inline-flex cursor-pointer items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/15">
							{session.isParsingFile ? "解析中..." : "上传简历文件"}
							<input
								type="file"
								accept=".txt,.md,.json,.docx,.pdf,.doc"
								className="sr-only"
								onChange={session.handleFileChange}
								disabled={session.isParsingFile}
							/>
						</label>
					</div>
					<textarea
						id="resume-context"
						value={session.resumeText}
						onChange={(event) => session.setResumeText(event.target.value)}
						className="mt-3 h-40 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/50"
						placeholder="粘贴真实简历内容，或上传文件后开始真实面试。"
					/>
					<div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.7fr_auto]">
						<input
							value={session.position}
							onChange={(event) => session.setPosition(event.target.value)}
							className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
							placeholder="目标岗位，例如：前端实习生"
						/>
						<div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs leading-5 text-slate-400">
							<p>{session.fileStatus}</p>
							<p>当前字数：{session.resumeText.length}</p>
						</div>
						<button
							type="button"
							onClick={session.handlePrepareInterview}
							disabled={!session.canStartInterview}
							className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:translate-y-0"
						>
							{session.isPreparing ? "真实 AI 解析中..." : "解析简历并开始"}
						</button>
					</div>
				</div>

				{session.errorMessage ? (
					<div className="mb-5 rounded-3xl border border-red-300/25 bg-red-300/10 p-4 text-sm leading-6 text-red-100">
						{session.errorMessage}
					</div>
				) : null}

				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
							当前追问点 · {session.round?.focus ?? "等待真实简历解析"}
						</p>
						<h2 className="mt-3 text-2xl font-semibold text-white">
							{session.round?.question ??
								"上传或粘贴真实简历后，真实 AI 会先解析项目/实习/技能线索，再开始一面追问。"}
						</h2>
					</div>
					<span className="w-fit rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
						当前点已追问 {session.topicDepth} 次
					</span>
				</div>
				<div className="mt-4 flex flex-wrap gap-2 text-xs">
					<span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-emerald-100">
						追问来源：真实 AI
					</span>
					<span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100">
						基础/八股已生成 {session.generatedFundamentalCount} 轮，已回答{" "}
						{session.fundamentalCount} 轮
					</span>
					<span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
						不使用 Mock 接口或硬编码候选人画像
					</span>
				</div>

				<div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
					<label htmlFor="answer" className="text-sm font-medium text-slate-200">
						我的回答
					</label>
					<textarea
						id="answer"
						value={session.answer}
						onChange={(event) => session.setAnswer(event.target.value)}
						className="mt-3 min-h-44 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/50"
						placeholder="按真实面试回答：背景、个人职责、技术取舍、边界情况、验证结果。"
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
				</div>

				<div className="mt-5 grid gap-3 md:grid-cols-2">
					<div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
						<p className="font-semibold text-amber-200">面试官追问</p>
						<p className="mt-2">
							{session.round?.followUp ?? "开始后这里会显示真实 AI 的继续追问。"}
						</p>
					</div>
					<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
						<p className="font-semibold text-white">即时反馈</p>
						<p className="mt-2">{session.round?.feedback ?? session.planSummary}</p>
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
							<p className="mt-2">{session.round?.trigger ?? "等待真实简历解析。"}</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
							<p className="font-semibold text-cyan-100">考察维度</p>
							<p className="mt-2">
								{session.round?.dimension ?? "项目/实习/岗位基础能力"}
							</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
							<p className="font-semibold text-cyan-100">合格标准</p>
							<p className="mt-2">
								{session.round?.answerStandard ??
									"合格回答需要来自真实简历，不能靠预设项目或 Mock 内容。"}
							</p>
						</div>
					</div>
				</section>

				<div className="mt-6 flex flex-col gap-3 sm:flex-row">
					<button
						type="button"
						onClick={session.handleAnswerSubmit}
						disabled={!session.canAdvance}
						className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:translate-y-0"
					>
						{session.isCompleted
							? "训练已完成"
							: session.isAdvancing
								? "真实 AI 正在追问..."
								: session.mode === "auto"
									? "提交回答，继续追问"
									: "继续追问"}
					</button>
					<button
						type="button"
						onClick={session.handleReset}
						className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
					>
						重置训练
					</button>
					{session.mode === "practice" ? (
						<button
							type="button"
							onClick={session.handleSwitchTopic}
							disabled={session.isAdvancing || session.isCompleted || session.topics.length === 0}
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
						onClick={session.handleFinishInterview}
						disabled={session.isAdvancing || session.isCompleted || session.rounds.length === 0}
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
				<ScoreBoard
					averageScore={session.averageScore}
					isCompleted={session.isCompleted}
					hasRound={Boolean(session.round)}
					isAiScore={Boolean(session.latestAiScore)}
					completedCount={session.completedCount}
					inquiryDepth={session.inquiryDepth}
					summary={session.summary}
				/>
				<ReviewPanel
					isGeneratingReview={session.isGeneratingReview}
					streamingReviewText={session.streamingReviewText}
					reviewData={session.reviewData}
					currentScore={session.currentScore}
					latestAiScore={session.latestAiScore}
					isAiScore={Boolean(session.latestAiScore)}
					fundamentalCount={session.fundamentalCount}
					mode={session.mode}
					reportMarkdown={session.reportMarkdown}
				/>
				<QuestionChain
					visibleRounds={session.visibleRounds}
					activeQuestion={session.activeQuestion}
					completedCount={session.completedCount}
				/>
			</aside>
		</div>
	);
}
