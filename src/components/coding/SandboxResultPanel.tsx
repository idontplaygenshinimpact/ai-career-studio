import { memo } from "react";
import type { SandboxResult } from "@/lib/sandbox";

type SandboxResultPanelProps = {
	result: SandboxResult | null;
};

export const SandboxResultPanel = memo(function SandboxResultPanel({ result }: SandboxResultPanelProps) {
	if (!result) return null;

	return (
		<div className={`rounded-[28px] border p-5 ${
			result.success
				? "border-emerald-300/20 bg-emerald-300/[0.06]"
				: "border-red-300/20 bg-red-300/[0.06]"
		}`}>
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-white">
					{result.success ? "全部通过" : "未通过"}
				</h3>
				<div className="flex gap-3 text-xs text-slate-400">
					<span>{result.duration}ms</span>
					<span>CPU {result.perf.cpuTimeMs}ms</span>
					{result.perf.heapEstimateKB > 0 ? (
						<span>Heap {Math.round(result.perf.heapEstimateKB / 1024)}MB</span>
					) : null}
					{result.perf.timedOut ? <span className="text-red-300">超时</span> : null}
					{result.perf.memoryExceeded ? <span className="text-red-300">内存超限</span> : null}
				</div>
			</div>

			{result.error ? (
				<p className="mt-3 rounded-xl bg-black/30 p-3 text-sm text-red-200">
					{result.error}
				</p>
			) : null}

			{result.tests.length > 0 ? (
				<div className="mt-3 space-y-1.5">
					{result.tests.map((test) => (
						<div
							key={test.label}
							className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
								test.passed
									? "bg-emerald-300/10 text-emerald-100"
									: "bg-red-300/10 text-red-100"
							}`}
						>
							<span>{test.passed ? "\u2705" : "\u274c"}</span>
							<span>{test.label}</span>
						</div>
					))}
				</div>
			) : null}

			{result.logs.length > 0 ? (
				<div className="mt-3">
					<p className="mb-1.5 text-xs text-slate-400">Console</p>
					<pre className="rounded-xl bg-black/30 p-3 text-xs leading-5 text-slate-300">
						{result.logs.join("\n")}
					</pre>
				</div>
			) : null}
		</div>
	);
});
