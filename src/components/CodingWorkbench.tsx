"use client";

import { codingChallenges } from "@/data/coding-challenges";
import { DynamicCodeEditor } from "@/components/DynamicCodeEditor";
import { ChallengeList } from "@/components/coding/ChallengeList";
import { CodingStats } from "@/components/coding/CodingStats";
import { CustomTestPanel } from "@/components/coding/CustomTestPanel";
import { SnapshotPanel } from "@/components/coding/SnapshotPanel";
import { AttemptHistory } from "@/components/coding/AttemptHistory";
import { SandboxResultPanel } from "@/components/coding/SandboxResultPanel";
import { AiCodeReviewPanel } from "@/components/coding/AiCodeReviewPanel";
import { difficultyLabels } from "@/components/coding/types";
import { useCodingWorkbench } from "@/hooks/useCodingWorkbench";

export function CodingWorkbench() {
	const wb = useCodingWorkbench();

	return (
		<div className="grid gap-6 lg:grid-cols-[0.35fr_1fr]">
			<ChallengeList
				filter={wb.filter}
				onFilterChange={wb.handleFilterChange}
				filteredCount={wb.filteredChallenges.length}
				totalCount={codingChallenges.length}
				visibleChallenges={wb.visibleChallenges}
				selectedId={wb.selectedId}
				onSelect={wb.handleSelectChallenge}
				visibleCount={wb.visibleCount}
				loadMoreRef={wb.loadMoreRef as React.RefObject<HTMLDivElement>}
			/>

			<div className="space-y-5">
				<CodingStats
					attemptCount={wb.challengeAttempts.length}
					snapshotCount={wb.challengeSnapshots.length}
					favoriteCount={wb.favoriteCount}
					latestResult={wb.latestAttempt ? `${wb.latestAttempt.passedCount}/${wb.latestAttempt.totalCount}` : "--"}
				/>

				<div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
					<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-xl font-semibold text-white">{wb.challenge.title}</h2>
							<p className="mt-2 text-sm leading-7 text-slate-300">{wb.challenge.description}</p>
						</div>
						<div className="flex flex-wrap gap-2 text-xs">
							<button
								type="button"
								onClick={wb.handleToggleFavorite}
								className={`rounded-full border px-3 py-1 transition-colors ${
									wb.isFavorite
										? "border-amber-300/40 bg-amber-300/15 text-amber-100"
										: "border-white/10 bg-white/[0.04] text-slate-300 hover:border-amber-300/30 hover:text-amber-100"
								}`}
							>
								{wb.isFavorite ? "\u2605 已收藏" : "\u2606 收藏"}
							</button>
							<span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-100">
								限时 {wb.challenge.timeLimit} 分钟
							</span>
							<span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
								难度 {difficultyLabels[wb.challenge.difficulty]}
							</span>
						</div>
					</div>

					<DynamicCodeEditor value={wb.code} onChange={wb.handleCodeChange} />

					<div className="mt-4 flex flex-wrap gap-3">
						<button type="button" onClick={wb.handleRun} disabled={wb.isRunning} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
							{wb.isRunning ? "运行中..." : "运行测试"}
						</button>
						<button type="button" onClick={() => wb.handleAiReview("full")} disabled={wb.aiReview.isLoading || !wb.sandboxResult} className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
							{wb.aiReview.isLoading ? "AI 审查中..." : wb.sandboxResult ? "AI 代码审查" : "先运行测试"}
						</button>
						{wb.sandboxResult && !wb.sandboxResult.success ? (
							<button type="button" onClick={() => wb.handleAiReview("explain-failure")} disabled={wb.aiReview.isLoading} className="rounded-full border border-red-200/25 bg-red-200/10 px-5 py-3 text-sm font-semibold text-red-100 transition-colors hover:bg-red-200/15 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/40 disabled:text-slate-500">
								AI 讲解失败用例
							</button>
						) : null}
						{wb.aiReview.isLoading ? (
							<button type="button" onClick={() => wb.aiReview.cancel()} className="rounded-full border border-red-300/25 bg-red-300/10 px-5 py-3 text-sm font-semibold text-red-100 transition-colors hover:bg-red-300/15">
								取消 AI 请求
							</button>
						) : null}
						<button type="button" onClick={wb.handleSaveSnapshot} className="rounded-full border border-amber-200/25 bg-amber-200/10 px-5 py-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-200/15">
							保存快照
						</button>
						<button type="button" onClick={() => wb.setShowCustomTests((prev) => !prev)} className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
							{wb.showCustomTests ? "收起自定义测试" : "自定义测试"}
						</button>
						<button type="button" onClick={wb.handleReset} className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
							重置代码
						</button>
					</div>

					{wb.aiReview.status ? (
						<p className="mt-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-2 text-xs text-cyan-100">
							{wb.aiReview.status}
						</p>
					) : null}

					{wb.showCustomTests ? (
						<CustomTestPanel
							value={wb.customTest}
							onChange={wb.handleCustomTestChange}
							onClear={() => wb.handleCustomTestChange("")}
						/>
					) : null}
				</div>

				{wb.challengeSnapshots.length > 0 || wb.challengeAttempts.length > 0 ? (
					<div className="grid gap-5 lg:grid-cols-2">
						<SnapshotPanel snapshots={wb.challengeSnapshots} onRestore={wb.handleRestoreSnapshot} />
						<AttemptHistory attempts={wb.challengeAttempts} />
					</div>
				) : null}

				<SandboxResultPanel result={wb.sandboxResult} />
				<AiCodeReviewPanel error={wb.aiReview.error} result={wb.reviewResult} />
			</div>
		</div>
	);
}
