"use client";

import { useCallback, useEffect, useState } from "react";
import {
	loadResumeLines,
	loadResumeVersions,
	getVersionsForLine,
	aggregateSuggestions,
	updateLineLabel,
	deleteResumeVersion,
	diffLines,
	type DiffLine,
} from "@/lib/resume-versions";
import type { ResumeLine, ResumeVersion, ResumeSuggestion } from "@/data/resume-version-types";
import { generateComprehensiveAdvice, type ComprehensiveAdvice } from "@/lib/comprehensive-advice";

const SOURCE_LABELS: Record<string, string> = {
	"jd-match": "JD 匹配",
	"resume-review": "简历诊断",
	"project-polish": "项目优化",
	"mock-interview": "模拟面试",
	manual: "手动",
};

const READINESS_COLORS: Record<string, string> = {
	"可以投递": "text-emerald-300",
	"基本准备好": "text-cyan-300",
	"需要继续打磨": "text-amber-300",
	"建议先集中训练": "text-red-300",
};

const CATEGORY_ICONS: Record<string, string> = {
	resume: "\u{1F4DD}",
	interview: "\u{1F3A4}",
	coding: "\u{1F4BB}",
};

function formatDate(iso: string) {
	return new Date(iso).toLocaleString("zh-CN", {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function ScoreChip({ label, value }: { label: string; value: number | undefined }) {
	if (value === undefined) return null;
	return (
		<span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs">
			{label} <span className="font-semibold text-amber-100">{value}</span>
		</span>
	);
}

export function ResumeVersionsWorkbench() {
	const [lines, setLines] = useState<ResumeLine[]>([]);
	const [allVersions, setAllVersions] = useState<ResumeVersion[]>([]);
	const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
	const [advice, setAdvice] = useState<ComprehensiveAdvice | null>(null);
	const [editingLabel, setEditingLabel] = useState<string | null>(null);
	const [labelInput, setLabelInput] = useState("");

	const reload = useCallback(() => {
		const l = loadResumeLines();
		setLines(l);
		setAllVersions(loadResumeVersions());
		setAdvice(generateComprehensiveAdvice());
		if (l.length > 0 && !selectedLineId) {
			setSelectedLineId(l[0].id);
		}
	}, [selectedLineId]);

	useEffect(() => { reload(); }, [reload]);

	const lineVersions = selectedLineId ? getVersionsForLine(selectedLineId) : [];
	const suggestions = selectedLineId ? aggregateSuggestions(selectedLineId) : [];
	const selectedVersion = allVersions.find((v) => v.id === selectedVersionId) ?? null;
	const compareVersion = allVersions.find((v) => v.id === compareVersionId) ?? null;

	const diff: DiffLine[] = selectedVersion && compareVersion
		? diffLines(compareVersion.text, selectedVersion.text)
		: [];

	function handleSaveLabel(lineId: string) {
		if (labelInput.trim()) {
			updateLineLabel(lineId, labelInput.trim());
			reload();
		}
		setEditingLabel(null);
	}

	if (lines.length === 0) {
		return (
			<div className="rounded-[28px] border border-amber-300/15 bg-amber-300/[0.04] p-8 text-center">
				<p className="text-4xl font-black text-amber-100/30">&mdash;</p>
				<p className="mt-4 text-sm text-amber-100/60">
					还没有简历版本记录。在 JD 匹配、简历诊断或模拟面试中提交简历后，这里会自动记录版本。
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{advice ? (
				<section className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Comprehensive Review</p>
							<h2 className="mt-2 text-lg font-semibold text-white">
								投递准备度：<span className={READINESS_COLORS[advice.readiness] ?? "text-slate-300"}>{advice.readiness}</span>
							</h2>
							<p className="mt-1 text-xs text-slate-400">基于近期训练数据，仅供参考</p>
						</div>
					</div>
					<div className="mt-4 grid gap-3 sm:grid-cols-4">
						{[
							{ label: "简历诊断", value: advice.resumeScore, unit: "分" },
							{ label: "面试均分", value: advice.interviewAvg, unit: "分" },
							{ label: "手写通过率", value: advice.codingPassRate, unit: "%" },
							{ label: "待处理建议", value: advice.unresolvedCount, unit: "条" },
						].map((item) => (
							<div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-center">
								<p className="text-[10px] text-slate-500">{item.label}</p>
								<p className="mt-1 text-xl font-black text-white">
									{item.value ?? "--"}<span className="ml-0.5 text-xs font-normal text-slate-400">{item.value !== null ? item.unit : ""}</span>
								</p>
							</div>
						))}
					</div>
					{advice.nextActions.length > 0 ? (
						<div className="mt-4 space-y-2">
							<p className="text-xs text-slate-400">下一步建议</p>
							{advice.nextActions.map((action) => (
								<div key={`${action.category}-${action.action}`} className="flex items-start gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
									<span>{CATEGORY_ICONS[action.category] ?? ""}</span>
									<span>{action.action}</span>
								</div>
							))}
						</div>
					) : null}
				</section>
			) : null}

			<div className="grid gap-6 lg:grid-cols-[0.35fr_1fr]">
				<aside className="space-y-3">
					<h3 className="text-sm font-semibold text-slate-300">简历线</h3>
					{lines.map((line) => {
						const isActive = line.id === selectedLineId;
						const vCount = allVersions.filter((v) => v.lineId === line.id).length;
						return (
							<button
								key={line.id}
								type="button"
								onClick={() => {
									setSelectedLineId(line.id);
									setSelectedVersionId(null);
									setCompareVersionId(null);
								}}
								className={`w-full rounded-2xl border p-3 text-left transition-all ${
									isActive
										? "border-amber-300/50 bg-amber-300/10"
										: "border-white/5 bg-white/[0.02] hover:border-white/15"
								}`}
							>
								<div className="flex items-center justify-between gap-2">
									{editingLabel === line.id ? (
										<input
											value={labelInput}
											onChange={(e) => setLabelInput(e.target.value)}
											onBlur={() => handleSaveLabel(line.id)}
											onKeyDown={(e) => e.key === "Enter" && handleSaveLabel(line.id)}
											className="w-full rounded bg-black/30 px-2 py-1 text-xs text-white outline-none"
										/>
									) : (
										<button
											type="button"
											className="text-left text-sm font-medium text-white"
											onDoubleClick={() => { setEditingLabel(line.id); setLabelInput(line.label); }}
										>
											{line.label}
										</button>
									)}
								</div>
								<p className="mt-1 text-[10px] text-slate-500">
									{vCount} 个版本 · {formatDate(line.createdAt)}
								</p>
							</button>
						);
					})}
				</aside>

				<div className="space-y-5">
					{lineVersions.length > 0 ? (
						<section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
							<h3 className="text-sm font-semibold text-white">版本时间线</h3>
							<div className="mt-4 space-y-3">
								{lineVersions.map((version, index) => {
									const isSelected = version.id === selectedVersionId;
									const isCompare = version.id === compareVersionId;
									return (
										<div
											key={version.id}
											className={`rounded-2xl border p-3 transition-all ${
												isSelected
													? "border-cyan-300/50 bg-cyan-300/10"
													: isCompare
														? "border-amber-300/50 bg-amber-300/10"
														: "border-white/10 bg-slate-950/40"
											}`}
										>
											<div className="flex items-center justify-between gap-3">
												<div>
													<span className="text-sm font-medium text-white">
														v{lineVersions.length - index}
													</span>
													<span className="ml-2 text-xs text-slate-400">
														{SOURCE_LABELS[version.source] ?? version.source} · {formatDate(version.createdAt)}
													</span>
												</div>
												<div className="flex gap-2">
													<ScoreChip label="诊断" value={version.scores.resumeReview} />
													<ScoreChip label="JD" value={version.scores.jdMatch} />
													<ScoreChip label="面试" value={version.scores.interviewAvg} />
												</div>
											</div>
											<div className="mt-2 flex gap-2">
												<button
													type="button"
													onClick={() => setSelectedVersionId(isSelected ? null : version.id)}
													className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100 hover:bg-cyan-300/15"
												>
													{isSelected ? "收起" : "查看"}
												</button>
												{selectedVersionId && version.id !== selectedVersionId ? (
													<button
														type="button"
														onClick={() => setCompareVersionId(isCompare ? null : version.id)}
														className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100 hover:bg-amber-300/15"
													>
														{isCompare ? "取消对比" : "对比"}
													</button>
												) : null}
												<button
													type="button"
													onClick={() => {
														deleteResumeVersion(version.id);
														if (selectedVersionId === version.id) setSelectedVersionId(null);
														if (compareVersionId === version.id) setCompareVersionId(null);
														reload();
													}}
													className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-xs text-red-100 hover:bg-red-300/15"
												>
													删除
												</button>
											</div>
										</div>
									);
								})}
							</div>
						</section>
					) : null}

					{selectedVersion && !compareVersion ? (
						<section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
							<h3 className="text-sm font-semibold text-white">简历内容</h3>
							<pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-4 text-xs leading-6 text-slate-200">
								{selectedVersion.text}
							</pre>
							{selectedVersion.suggestions.length > 0 ? (
								<div className="mt-4">
									<p className="text-xs text-slate-400">AI 改进建议（{selectedVersion.suggestions.length} 条）</p>
									<div className="mt-2 space-y-1.5">
									{selectedVersion.suggestions.map((s) => (
										<SuggestionRow key={`${s.source}-${s.content}`} suggestion={s} />
									))}
									</div>
								</div>
							) : null}
						</section>
					) : null}

					{selectedVersion && compareVersion ? (
						<section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-semibold text-white">版本对比</h3>
								<div className="flex gap-3 text-xs">
									<span className="text-cyan-200">新版本</span>
									<span className="text-amber-200">旧版本</span>
								</div>
							</div>
							<div className="mt-3 max-h-96 overflow-y-auto rounded-2xl bg-black/30 p-4">
								{diff.map((line) => (
									<div
										key={`${line.type}-${line.content}`}
										className={`px-2 py-0.5 font-mono text-xs leading-5 ${
											line.type === "added"
												? "bg-emerald-300/10 text-emerald-200"
												: line.type === "removed"
													? "bg-red-300/10 text-red-200"
													: "text-slate-400"
										}`}
									>
										<span className="mr-2 inline-block w-3 text-center text-slate-600">
											{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
										</span>
										{line.content || " "}
									</div>
								))}
							</div>

							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								<div>
									<p className="text-xs text-amber-200">旧版本评分</p>
									<div className="mt-1 flex gap-2">
										<ScoreChip label="诊断" value={compareVersion.scores.resumeReview} />
										<ScoreChip label="JD" value={compareVersion.scores.jdMatch} />
										<ScoreChip label="面试" value={compareVersion.scores.interviewAvg} />
									</div>
								</div>
								<div>
									<p className="text-xs text-cyan-200">新版本评分</p>
									<div className="mt-1 flex gap-2">
										<ScoreChip label="诊断" value={selectedVersion.scores.resumeReview} />
										<ScoreChip label="JD" value={selectedVersion.scores.jdMatch} />
										<ScoreChip label="面试" value={selectedVersion.scores.interviewAvg} />
									</div>
								</div>
							</div>
						</section>
					) : null}

					{suggestions.length > 0 ? (
						<section className="rounded-[28px] border border-amber-300/15 bg-amber-300/[0.04] p-5">
							<h3 className="text-sm font-semibold text-white">聚合改进建议</h3>
							<p className="mt-1 text-xs text-slate-400">来自 JD 匹配、简历诊断和模拟面试的去重建议，按出现频率排序</p>
							<div className="mt-3 space-y-1.5">
								{suggestions.slice(0, 10).map((s) => (
									<SuggestionRow key={`${s.source}-${s.content}`} suggestion={s} />
								))}
							</div>
						</section>
					) : null}
				</div>
			</div>
		</div>
	);
}

function SuggestionRow({ suggestion }: { suggestion: ResumeSuggestion }) {
	const colors = {
		high: "border-red-300/20 bg-red-300/10 text-red-100",
		medium: "border-amber-300/20 bg-amber-300/10 text-amber-100",
		low: "border-white/10 bg-white/[0.04] text-slate-300",
	};

	const icons = { high: "\u{1F534}", medium: "\u{1F7E1}", low: "\u{1F7E2}" };

	return (
		<div className={`rounded-2xl border px-3 py-2 text-xs ${colors[suggestion.priority]}`}>
			<span className="mr-1.5">{icons[suggestion.priority]}</span>
			<span className="text-slate-400">[{SOURCE_LABELS[suggestion.source] ?? suggestion.source}]</span>{" "}
			{suggestion.content}
		</div>
	);
}
