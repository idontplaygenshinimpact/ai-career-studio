"use client";

import { useEffect, useState } from "react";
import {
	loadInterviewHistory,
	deleteInterviewRecord,
	type InterviewRecord,
} from "@/lib/storage";
import { downloadMarkdown } from "@/lib/export";

export function InterviewHistory() {
	const [records, setRecords] = useState<InterviewRecord[]>([]);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	useEffect(() => {
		setRecords(loadInterviewHistory());
	}, []);

	function handleDelete(id: string) {
		deleteInterviewRecord(id);
		setRecords(loadInterviewHistory());
	}

	function handleDownload(record: InterviewRecord) {
		downloadMarkdown(
			record.reportMarkdown,
			`interview-${record.date.slice(0, 10)}.md`,
		);
	}

	if (records.length === 0) {
		return null;
	}

	return (
		<section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
			<h2 className="text-lg font-semibold text-white">
				历史面试记录（{records.length}）
			</h2>
			<p className="mt-2 text-xs text-slate-400">
				面试结束后自动保存，最多保留 20 条。
			</p>
			<div className="mt-4 space-y-3">
				{records.map((record) => {
					const isExpanded = expandedId === record.id;
					const date = new Date(record.date);
					const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

					return (
						<div
							key={record.id}
							className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
						>
							<div className="flex items-center justify-between gap-3">
								<button
									type="button"
									onClick={() =>
										setExpandedId(isExpanded ? null : record.id)
									}
									className="flex flex-1 items-center gap-3 text-left"
								>
									<span className="text-2xl font-black text-amber-100">
										{record.averageScore}
									</span>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-white">
											{record.position} ·{" "}
											{record.mode === "auto"
												? "连贯追问"
												: "练习模式"}
										</p>
										<p className="text-xs text-slate-400">
											{dateStr} · {record.roundCount} 轮追问
										</p>
									</div>
									<span className="text-xs text-slate-500">
										{isExpanded ? "收起" : "展开"}
									</span>
								</button>
							</div>
							{isExpanded ? (
								<div className="mt-3 space-y-3">
									{record.reviewSummary ? (
										<p className="text-sm leading-7 text-slate-300">
											{record.reviewSummary}
										</p>
									) : null}
									<textarea
										readOnly
										value={record.reportMarkdown}
										className="h-40 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-6 text-slate-400 outline-none"
									/>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => handleDownload(record)}
											className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/15"
										>
											下载 Markdown
										</button>
										<button
											type="button"
											onClick={() => handleDelete(record.id)}
											className="rounded-full border border-red-300/25 bg-red-300/10 px-4 py-2 text-xs font-semibold text-red-100 transition-colors hover:bg-red-300/15"
										>
											删除记录
										</button>
									</div>
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</section>
	);
}
