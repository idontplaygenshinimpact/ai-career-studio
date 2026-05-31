import { memo } from "react";
import { formatTime, type CodingAttempt } from "@/components/coding/types";

type AttemptHistoryProps = {
	attempts: CodingAttempt[];
};

export const AttemptHistory = memo(function AttemptHistory({ attempts }: AttemptHistoryProps) {
	if (attempts.length === 0) return null;

	return (
		<section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
			<h3 className="text-sm font-semibold text-white">提交记录</h3>
			<div className="mt-3 space-y-2">
				{attempts.slice(0, 5).map((attempt) => (
					<div key={attempt.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-xs">
						<div className="flex items-center justify-between gap-3">
							<span className={attempt.success ? "text-emerald-200" : "text-red-200"}>
								{attempt.success ? "通过" : "失败"} {attempt.passedCount}/{attempt.totalCount}
							</span>
							<span className="text-slate-500">{formatTime(attempt.createdAt)}</span>
						</div>
						<p className="mt-1 text-slate-500">
							耗时 {attempt.duration}ms · CPU {attempt.cpuTimeMs}ms{attempt.error ? ` · ${attempt.error}` : ""}
						</p>
					</div>
				))}
			</div>
		</section>
	);
});
