"use client";

import { useEffect, useState } from "react";
import { loadInterviewHistory, type InterviewRecord } from "@/lib/storage";
import { DIMENSION_LABELS } from "@/data/dimensions";

const CHART_WIDTH = 400;
const CHART_HEIGHT = 160;
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };
const INNER_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

function buildPolyline(records: InterviewRecord[]): string {
	if (records.length === 0) return "";
	if (records.length === 1) {
		const x = PADDING.left + INNER_WIDTH / 2;
		const y = PADDING.top + INNER_HEIGHT * (1 - records[0].averageScore / 100);
		return `${x},${y}`;
	}

	return records
		.map((r, i) => {
			const x = PADDING.left + (i / (records.length - 1)) * INNER_WIDTH;
			const y = PADDING.top + INNER_HEIGHT * (1 - r.averageScore / 100);
			return `${x},${y}`;
		})
		.join(" ");
}

export function ProgressTracker() {
	const [records, setRecords] = useState<InterviewRecord[]>([]);

	useEffect(() => {
		const history = loadInterviewHistory();
		setRecords(history.slice().reverse());
	}, []);

	if (records.length < 2) {
		return null;
	}

	const polyline = buildPolyline(records);
	const latest = records[records.length - 1];
	const first = records[0];
	const diff = latest.averageScore - first.averageScore;

	const latestDimensions = latest.dimensions;
	const firstDimensions = first.dimensions;

	return (
		<section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-slate-400">
						进步追踪
					</p>
					<p className="mt-1 text-sm text-slate-300">
						{records.length} 次面试记录
					</p>
				</div>
				<div className="text-right">
					<span
						className={`text-2xl font-black ${diff > 0 ? "text-emerald-300" : diff < 0 ? "text-red-300" : "text-slate-300"}`}
					>
						{diff > 0 ? "+" : ""}
						{diff}
					</span>
					<p className="text-xs text-slate-500">
						{first.averageScore} → {latest.averageScore}
					</p>
				</div>
			</div>

			<svg
				viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
				className="mt-4 w-full"
				aria-label="面试分数趋势图"
			>
				{[0, 25, 50, 75, 100].map((tick) => {
					const y = PADDING.top + INNER_HEIGHT * (1 - tick / 100);
					return (
						<g key={tick}>
							<line
								x1={PADDING.left}
								y1={y}
								x2={PADDING.left + INNER_WIDTH}
								y2={y}
								stroke="white"
								strokeOpacity={0.06}
							/>
							<text
								x={PADDING.left - 8}
								y={y + 4}
								textAnchor="end"
								fontSize="10"
								fill="#64748b"
							>
								{tick}
							</text>
						</g>
					);
				})}

				<polyline
					points={polyline}
					fill="none"
					stroke="#fbbf24"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				{records.map((r, i) => {
					const x =
						records.length === 1
							? PADDING.left + INNER_WIDTH / 2
							: PADDING.left + (i / (records.length - 1)) * INNER_WIDTH;
					const y = PADDING.top + INNER_HEIGHT * (1 - r.averageScore / 100);
					return (
						<circle
							key={r.id}
							cx={x}
							cy={y}
							r="4"
							fill="#020617"
							stroke="#fbbf24"
							strokeWidth="2"
						/>
					);
				})}

				{records.map((r, i) => {
					const x =
						records.length === 1
							? PADDING.left + INNER_WIDTH / 2
							: PADDING.left + (i / (records.length - 1)) * INNER_WIDTH;
					return (
						<text
							key={`label-${r.id}`}
							x={x}
							y={CHART_HEIGHT - 6}
							textAnchor="middle"
							fontSize="9"
							fill="#475569"
						>
							{new Date(r.date).toLocaleDateString("zh-CN", {
								month: "numeric",
								day: "numeric",
							})}
						</text>
					);
				})}
			</svg>

			{latestDimensions && firstDimensions ? (
				<div className="mt-4">
					<p className="text-xs text-slate-400">各维度变化（首次 → 最近）</p>
					<div className="mt-2 grid grid-cols-5 gap-2">
						{DIMENSION_LABELS.map(({ key, label, max }) => {
							const firstVal = firstDimensions[key];
							const latestVal = latestDimensions[key];
							const dimDiff = latestVal - firstVal;
							const pct = Math.round((latestVal / max) * 100);
							return (
								<div key={key} className="text-center">
									<p className="text-[10px] text-slate-500">{label}</p>
									<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
										<div
											className="h-full rounded-full bg-amber-300/60 transition-all"
											style={{ width: `${pct}%` }}
										/>
									</div>
									<p
										className={`mt-1 text-xs font-semibold ${dimDiff > 0 ? "text-emerald-300" : dimDiff < 0 ? "text-red-300" : "text-slate-400"}`}
									>
										{dimDiff > 0 ? "+" : ""}
										{dimDiff}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			) : null}
		</section>
	);
}
