"use client";

import { memo } from "react";

type ScoreBoardProps = {
	averageScore: number;
	isCompleted: boolean;
	hasRound: boolean;
	completedCount: number;
	inquiryDepth: number;
	summary: string;
	isAiScore: boolean;
};

export const ScoreBoard = memo(function ScoreBoard({
	averageScore,
	isCompleted,
	hasRound,
	completedCount,
	inquiryDepth,
	summary,
	isAiScore,
}: ScoreBoardProps) {
	if (!hasRound) {
		return (
			<section className="rounded-[32px] border border-amber-300/20 bg-amber-300/10 p-6 text-slate-50 shadow-[0_24px_80px_rgba(251,191,36,0.12)]">
				<p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
					Interview Score
				</p>
				<div className="mt-3 text-4xl font-black text-amber-100/30">&mdash;</div>
				<p className="mt-4 text-sm leading-7 text-amber-50/60">
					上传简历并开始面试后，这里会实时显示评分和追问进度。
				</p>
			</section>
		);
	}

	return (
		<section className="rounded-[32px] border border-amber-300/20 bg-amber-300/10 p-6 text-slate-50 shadow-[0_24px_80px_rgba(251,191,36,0.12)]">
			<div className="flex items-end justify-between gap-4">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
						{isAiScore ? "AI Score" : "参考分"}
					</p>
					<div className="mt-2 text-5xl font-black text-amber-100">
						{averageScore}
					</div>
					{!isAiScore ? (
						<p className="mt-1 text-xs text-amber-200/50">
							提交回答后将由 AI 评分
						</p>
					) : null}
				</div>
				<div className="text-right text-sm text-amber-50/80">
					<p>{isCompleted ? "已生成复盘" : "面试进行中"}</p>
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
	);
});
