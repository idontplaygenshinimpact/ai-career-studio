import { memo } from "react";
import { formatTime, type CodingSnapshot } from "@/components/coding/types";

type SnapshotPanelProps = {
	snapshots: CodingSnapshot[];
	onRestore: (snapshot: CodingSnapshot) => void;
};

export const SnapshotPanel = memo(function SnapshotPanel({ snapshots, onRestore }: SnapshotPanelProps) {
	if (snapshots.length === 0) return null;

	return (
		<section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
			<h3 className="text-sm font-semibold text-white">代码快照</h3>
			<div className="mt-3 space-y-2">
				{snapshots.slice(0, 4).map((snapshot) => (
					<div key={snapshot.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2">
						<span className="text-xs text-slate-400">{formatTime(snapshot.createdAt)}</span>
						<button
							type="button"
							onClick={() => onRestore(snapshot)}
							className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100 hover:bg-cyan-300/15"
						>
							恢复
						</button>
					</div>
				))}
			</div>
		</section>
	);
});
