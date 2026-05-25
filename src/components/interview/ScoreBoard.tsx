"use client";

type ScoreBoardProps = {
	averageScore: number;
	isCompleted: boolean;
	hasRound: boolean;
	completedCount: number;
	inquiryDepth: number;
	summary: string;
};

export function ScoreBoard({
	averageScore,
	isCompleted,
	hasRound,
	completedCount,
	inquiryDepth,
	summary,
}: ScoreBoardProps) {
	return (
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
							: hasRound
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
	);
}
