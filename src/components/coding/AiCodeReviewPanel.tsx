import { memo } from "react";
import type { CodeReviewResult } from "@/components/coding/types";

type AiCodeReviewPanelProps = {
	error: string;
	result: CodeReviewResult | null;
};

export const AiCodeReviewPanel = memo(function AiCodeReviewPanel({ error, result }: AiCodeReviewPanelProps) {
	return (
		<>
			{error ? (
				<div className="rounded-[28px] border border-red-300/20 bg-red-300/[0.06] p-5 text-sm text-red-100">
					{error}
				</div>
			) : null}

			{result ? (
				<div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
					<h3 className="text-lg font-semibold text-white">AI 代码审查</h3>

					<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
						{[
							{ label: "正确性", value: result.correctness, max: 30 },
							{ label: "边界处理", value: result.edgeCases, max: 25 },
							{ label: "复杂度", value: result.complexity, max: 25 },
							{ label: "风格", value: result.codeStyle, max: 20 },
							{ label: "总分", value: result.total, max: 100 },
						].map((dim) => (
							<div
								key={dim.label}
								className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-center"
							>
								<div className="text-2xl font-black text-amber-100">
									{dim.value}
								</div>
								<div className="mt-1 text-[10px] text-slate-400">
									{dim.label}（/{dim.max}）
								</div>
							</div>
						))}
					</div>

					{result.comment ? (
						<p className="mt-4 text-sm leading-7 text-slate-200">
							{result.comment}
						</p>
					) : null}

					{result.suggestions.length > 0 ? (
						<div className="mt-4">
							<p className="mb-2 text-sm font-medium text-cyan-200">改进建议</p>
							<ul className="space-y-1.5 text-sm leading-7 text-slate-300">
								{result.suggestions.map((s) => (
									<li key={s}>{"\u2022"} {s}</li>
								))}
							</ul>
						</div>
					) : null}
				</div>
			) : null}
		</>
	);
});
