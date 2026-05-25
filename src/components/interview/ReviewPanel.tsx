"use client";

import { useState } from "react";
import type { AnswerScore } from "@/lib/interview-core";
import type { ReviewResponse, InterviewMode } from "@/hooks/useInterviewSession";
import { downloadMarkdown, copyToClipboard } from "@/lib/export";

type ReviewPanelProps = {
	isGeneratingReview: boolean;
	reviewData: ReviewResponse | null;
	currentScore: AnswerScore;
	latestAiScore: AnswerScore | null | undefined;
	fundamentalCount: number;
	mode: InterviewMode;
	reportMarkdown: string;
};

export function ReviewPanel({
	isGeneratingReview,
	reviewData,
	currentScore,
	latestAiScore,
	fundamentalCount,
	mode,
	reportMarkdown,
}: ReviewPanelProps) {
	const [copied, setCopied] = useState(false);

	function handleDownload() {
		downloadMarkdown(reportMarkdown, `interview-report-${Date.now()}.md`);
	}

	async function handleCopy() {
		const ok = await copyToClipboard(reportMarkdown);
		if (ok) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}

	return (
		<section className="rounded-[28px] border border-white/10 bg-slate-950/75 p-5">
			<h2 className="text-lg font-semibold text-white">复盘报告</h2>
			{isGeneratingReview ? (
				<p className="mt-4 text-sm leading-7 text-slate-400">
					AI 正在生成个性化复盘报告...
				</p>
			) : reviewData ? (
				<div className="mt-4 space-y-4">
					{reviewData.interviewReadiness ? (
						<span
							className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
								reviewData.interviewReadiness === "可投递"
									? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
									: reviewData.interviewReadiness === "需打磨"
										? "border border-amber-300/30 bg-amber-300/10 text-amber-100"
										: "border border-red-300/30 bg-red-300/10 text-red-100"
							}`}
						>
							{reviewData.interviewReadiness}
						</span>
					) : null}
					{reviewData.overallComment ? (
						<p className="text-sm leading-7 text-slate-200">
							{reviewData.overallComment}
						</p>
					) : null}
					{reviewData.strengths && reviewData.strengths.length > 0 ? (
						<div>
							<p className="text-sm font-medium text-emerald-200">强项</p>
							<ul className="mt-1 space-y-1 text-sm leading-7 text-slate-300">
								{reviewData.strengths.map((item) => (
									<li key={item}>• {item}</li>
								))}
							</ul>
						</div>
					) : null}
					{reviewData.weaknesses && reviewData.weaknesses.length > 0 ? (
						<div>
							<p className="text-sm font-medium text-amber-200">短板</p>
							<ul className="mt-1 space-y-1 text-sm leading-7 text-slate-300">
								{reviewData.weaknesses.map((item) => (
									<li key={item}>• {item}</li>
								))}
							</ul>
						</div>
					) : null}
					{reviewData.nextSteps && reviewData.nextSteps.length > 0 ? (
						<div>
							<p className="text-sm font-medium text-cyan-200">下一步</p>
							<ul className="mt-1 space-y-1 text-sm leading-7 text-slate-300">
								{reviewData.nextSteps.map((item) => (
									<li key={item}>• {item}</li>
								))}
							</ul>
						</div>
					) : null}
				</div>
			) : (
				<div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
					<p>• 完成面试后，AI 将生成个性化复盘报告。</p>
					<p>• 报告包含针对你实际回答的优势分析、短板诊断和改进建议。</p>
				</div>
			)}
			<div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
				<span>技术准确性：{currentScore.accuracy}</span>
				<span>表达结构：{currentScore.structure}</span>
				<span>项目深度：{currentScore.depth}</span>
				<span>异常边界：{currentScore.riskHandling}</span>
				<span>基础/八股：{fundamentalCount} 轮</span>
				<span>{mode === "auto" ? "自动切题" : "手动练习"}</span>
			</div>
			{latestAiScore?.comment ? (
				<p className="mt-3 text-xs leading-5 text-amber-100/80">
					AI 点评：{latestAiScore.comment}
				</p>
			) : null}
			<textarea
				readOnly
				value={reportMarkdown}
				className="mt-4 h-36 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-6 text-slate-300 outline-none"
			/>
			<div className="mt-3 flex gap-2">
				<button
					type="button"
					onClick={handleDownload}
					className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/15"
				>
					下载 Markdown
				</button>
				<button
					type="button"
					onClick={handleCopy}
					className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
				>
					{copied ? "已复制" : "复制报告"}
				</button>
			</div>
		</section>
	);
}
