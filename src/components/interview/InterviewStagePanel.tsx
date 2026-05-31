"use client";

import { memo } from "react";
import type { InterviewMode } from "@/stores/interview-store";

type StageStatus = "waiting" | "active" | "done" | "error";

type InterviewStagePanelProps = {
	mode: InterviewMode;
	isPreparing: boolean;
	isAdvancing: boolean;
	isGeneratingReview: boolean;
	isCompleted: boolean;
	hasRound: boolean;
	hasError: boolean;
	topicsCount: number;
	roundsCount: number;
	completedCount: number;
	topicDepth: number;
	fundamentalCount: number;
	generatedFundamentalCount: number;
	hasCodingPrompt: boolean;
};

const statusLabel: Record<StageStatus, string> = {
	waiting: "等待",
	active: "进行中",
	done: "完成",
	error: "异常",
};

const statusClass: Record<StageStatus, string> = {
	waiting: "border-white/10 bg-white/[0.03] text-slate-400",
	active: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.08)]",
	done: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
	error: "border-red-300/30 bg-red-300/10 text-red-100",
};

function stageDotClass(status: StageStatus) {
	if (status === "active") return "bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.65)]";
	if (status === "done") return "bg-emerald-300";
	if (status === "error") return "bg-red-300";
	return "bg-slate-600";
}

export const InterviewStagePanel = memo(function InterviewStagePanel({
	mode,
	isPreparing,
	isAdvancing,
	isGeneratingReview,
	isCompleted,
	hasRound,
	hasError,
	topicsCount,
	roundsCount,
	completedCount,
	topicDepth,
	fundamentalCount,
	generatedFundamentalCount,
	hasCodingPrompt,
}: InterviewStagePanelProps) {
	const planningStatus: StageStatus = hasError && !hasRound
		? "error"
		: isPreparing
			? "active"
			: hasRound
				? "done"
				: "waiting";
	const roundStatus: StageStatus = hasError && hasRound
		? "error"
		: isAdvancing
			? "active"
			: isCompleted
				? "done"
				: hasRound
					? "active"
					: "waiting";
	const codingStatus: StageStatus = hasCodingPrompt
		? "active"
		: fundamentalCount > 0
			? "done"
			: generatedFundamentalCount > 0
				? "waiting"
				: "waiting";
	const reviewStatus: StageStatus = isGeneratingReview
		? "active"
		: isCompleted
			? "done"
			: "waiting";

	const stages: Array<{
		name: string;
		detail: string;
		status: StageStatus;
	}> = [
		{
			name: "简历输入",
			detail: hasRound ? "已进入面试会话" : "等待 40+ 字真实简历",
			status: hasRound || isPreparing ? "done" : "active",
		},
		{
			name: "AI 规划",
			detail: topicsCount > 0 ? `${topicsCount} 个追问点已生成` : "plan action 生成追问图谱",
			status: planningStatus,
		},
		{
			name: "动态追问",
			detail: roundsCount > 0 ? `${roundsCount} 轮轨迹，已答 ${completedCount} 轮` : "round action 按回答推进",
			status: roundStatus,
		},
		{
			name: "手写穿插",
			detail: hasCodingPrompt ? "当前题已切到代码沙箱" : `基础/手写覆盖 ${fundamentalCount}/${generatedFundamentalCount}`,
			status: codingStatus,
		},
		{
			name: "流式复盘",
			detail: isGeneratingReview ? "SSE 增量生成报告" : "review action 汇总面试轨迹",
			status: reviewStatus,
		},
	];

	return (
		<section className="rounded-[32px] border border-cyan-300/15 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(8,145,178,0.08)]">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
						State Machine
					</p>
					<h3 className="mt-2 text-lg font-semibold text-white">
						面试流程状态机
					</h3>
				</div>
				<span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
					{mode === "auto" ? "AI 自动切题" : "手动练习"}
				</span>
			</div>

			<div className="mt-5 space-y-3">
				{stages.map((stage, index) => (
					<div key={stage.name} className={`rounded-2xl border p-3 ${statusClass[stage.status]}`}>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<span className={`h-2.5 w-2.5 rounded-full ${stageDotClass(stage.status)}`} />
								<div>
									<p className="text-sm font-semibold">
										{index + 1}. {stage.name}
									</p>
									<p className="mt-1 text-xs leading-5 opacity-75">
										{stage.detail}
									</p>
								</div>
							</div>
							<span className="shrink-0 text-[10px] font-semibold opacity-80">
								{statusLabel[stage.status]}
							</span>
						</div>
					</div>
				))}
			</div>

			<div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
				<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
					<p className="text-slate-500">当前深挖</p>
					<p className="mt-1 text-lg font-black text-cyan-100">{topicDepth}</p>
				</div>
				<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
					<p className="text-slate-500">追问节点</p>
					<p className="mt-1 text-lg font-black text-amber-100">{topicsCount}</p>
				</div>
				<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
					<p className="text-slate-500">回答轮次</p>
					<p className="mt-1 text-lg font-black text-emerald-100">{completedCount}</p>
				</div>
			</div>
		</section>
	);
});
