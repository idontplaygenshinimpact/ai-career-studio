import { memo } from "react";
import type { CodingChallenge, ChallengeCategory } from "@/data/coding-challenges";
import { difficultyLabels, frequencyLabels } from "@/components/coding/types";

type ChallengeListProps = {
	filter: ChallengeCategory | "all";
	onFilterChange: (filter: ChallengeCategory | "all") => void;
	filteredCount: number;
	totalCount: number;
	visibleChallenges: CodingChallenge[];
	selectedId: string;
	onSelect: (id: string) => void;
	visibleCount: number;
	loadMoreRef: React.RefObject<HTMLDivElement>;
};

export const ChallengeList = memo(function ChallengeList({
	filter,
	onFilterChange,
	filteredCount,
	totalCount,
	visibleChallenges,
	selectedId,
	onSelect,
	visibleCount,
	loadMoreRef,
}: ChallengeListProps) {
	return (
		<aside className="sticky top-4 flex max-h-[calc(100vh-6rem)] flex-col rounded-[28px] border border-white/10 bg-slate-950/65 p-4">
			<h2 className="mb-3 text-sm font-semibold text-slate-300">
				题目列表（{filteredCount} / {totalCount}）
			</h2>
			<div className="mb-3 flex gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
				{([[
					"all",
					"全部",
				], ["handwrite", "手写题"], ["algorithm", "算法题"]] as const).map(([key, label]) => (
					<button
						key={key}
						type="button"
						onClick={() => onFilterChange(key)}
						className={`flex-1 rounded-full px-2 py-1.5 transition-colors ${
							filter === key
								? "bg-cyan-300/15 text-cyan-100"
								: "text-slate-400 hover:text-white"
						}`}
					>
						{label}
					</button>
				))}
			</div>
			<div className="flex-1 space-y-2 overflow-y-auto pr-1">
				{visibleChallenges.map((challenge, index) => {
					const isActive = challenge.id === selectedId;
					return (
						<button
							key={challenge.id}
							type="button"
							onClick={() => onSelect(challenge.id)}
							className={`w-full rounded-2xl border p-3 text-left transition-all ${
								isActive
									? "border-cyan-300/50 bg-cyan-300/10"
									: "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
							}`}
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-sm font-medium text-white">
									{String(index + 1).padStart(2, "0")}. {challenge.title}
								</span>
							</div>
							<div className="mt-1 flex gap-3 text-[10px] text-slate-400">
								<span>难度 {difficultyLabels[challenge.difficulty]}</span>
								<span>频率 {frequencyLabels[challenge.frequency]}</span>
								<span>{challenge.timeLimit}min</span>
							</div>
						</button>
					);
				})}
				{visibleCount < filteredCount ? (
					<div ref={loadMoreRef} className="py-2 text-center text-xs text-slate-500">
						加载更多（{visibleCount}/{filteredCount}）
					</div>
				) : null}
			</div>
		</aside>
	);
});