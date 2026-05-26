"use client";

import { memo } from "react";
import type { InterviewRound } from "@/lib/interview-core";

type QuestionChainProps = {
	visibleRounds: InterviewRound[];
	activeQuestion: number;
	completedCount: number;
};

export const QuestionChain = memo(function QuestionChain({
	visibleRounds,
	activeQuestion,
	completedCount,
}: QuestionChainProps) {
	return (
		<section className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 p-5">
			<h2 className="text-lg font-semibold text-white">追问链</h2>
			<p className="mt-2 text-xs leading-5 text-cyan-100/75">
				追问点来自简历解析结果，并穿插目标岗位高频基础知识；连贯模式由
				AI 面试官按回答质量、追问深度和逻辑边界自动切题。
			</p>
			<div className="mt-4 space-y-3 text-sm text-slate-200">
				{visibleRounds.length === 0 ? (
					<p className="text-slate-400">尚未生成追问链。</p>
				) : null}
				{visibleRounds.map((item, index) => {
					const isActive = index === activeQuestion;
					const isDone = index < completedCount;

					return (
						<div
							key={item.id}
							className={`rounded-2xl border p-3 ${
								isActive
									? "border-amber-300/40 bg-amber-300/10"
									: isDone
										? "border-cyan-300/25 bg-cyan-300/10"
										: "border-white/10 bg-white/[0.03]"
							}`}
						>
							<div className="flex items-center justify-between gap-3">
								<span>
									追问 {index + 1} · {item.focus}
								</span>
								<span className="text-xs text-slate-400">
									{isDone ? "已记录" : isActive ? "进行中" : "已生成"}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
});
