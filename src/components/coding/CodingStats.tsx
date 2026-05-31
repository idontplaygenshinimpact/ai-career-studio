import { memo } from "react";

type CodingStatsProps = {
	attemptCount: number;
	snapshotCount: number;
	favoriteCount: number;
	latestResult: string;
};

export const CodingStats = memo(function CodingStats({ attemptCount, snapshotCount, favoriteCount, latestResult }: CodingStatsProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-4">
			{[
				{ label: "运行次数", value: attemptCount },
				{ label: "快照", value: snapshotCount },
				{ label: "收藏题目", value: favoriteCount },
				{ label: "最近结果", value: latestResult },
			].map((item) => (
				<div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
					<p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
						{item.label}
					</p>
					<p className="mt-2 text-2xl font-black text-white">{item.value}</p>
				</div>
			))}
		</div>
	);
});