"use client";

import { useCallback, useEffect, useState } from "react";
import { loadInterviewHistory, type InterviewRecord } from "@/lib/storage";
import { loadJson } from "@/components/coding/storage";
import type { CodingAttempt } from "@/components/coding/types";
import { DIMENSION_LABELS } from "@/data/dimensions";
import { loadResumeVersions } from "@/lib/resume-versions";

const ATTEMPT_KEY = "acs_coding_attempts";
const FAVORITE_KEY = "acs_coding_favorites";

const DASHBOARD_REFRESH_EVENT = "acs:dashboard-refresh";

function RadarChart({ dimensions }: { dimensions: Record<string, number> }) {
	const labels = DIMENSION_LABELS;
	const cx = 80;
	const cy = 80;
	const r = 60;
	const angleStep = (2 * Math.PI) / labels.length;

	const points = labels.map((dim, i) => {
		const angle = -Math.PI / 2 + i * angleStep;
		const val = Math.min(1, (dimensions[dim.key] ?? 0) / dim.max);
		return {
			x: cx + r * val * Math.cos(angle),
			y: cy + r * val * Math.sin(angle),
			label: dim.label,
			lx: cx + (r + 14) * Math.cos(angle),
			ly: cy + (r + 14) * Math.sin(angle),
		};
	});

	const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

	return (
		<svg viewBox="0 0 160 160" className="mx-auto w-full max-w-[200px]" aria-label="能力雷达图">
			{[0.25, 0.5, 0.75, 1].map((scale) => (
				<polygon
					key={scale}
					points={labels
						.map((_, i) => {
							const a = -Math.PI / 2 + i * angleStep;
							return `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`;
						})
						.join(" ")}
					fill="none"
					stroke="white"
					strokeOpacity={0.06}
				/>
			))}
			{labels.map((_, i) => {
				const a = -Math.PI / 2 + i * angleStep;
				return (
					<line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="white" strokeOpacity={0.06} />
				);
			})}
			<polygon points={polygon} fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.5" />
			{points.map((p) => (
				<text key={p.label} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#94a3b8">
					{p.label}
				</text>
			))}
		</svg>
	);
}

export function refreshDashboard() {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
	}
}

export function TrainingDashboard() {
	const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
	const [attempts, setAttempts] = useState<CodingAttempt[]>([]);
	const [favoriteCount, setFavoriteCount] = useState(0);
	const [resumeVersionCount, setResumeVersionCount] = useState(0);

	const reload = useCallback(() => {
		setInterviews(loadInterviewHistory().slice().reverse());
		setAttempts(loadJson<CodingAttempt[]>(ATTEMPT_KEY, []));
		setFavoriteCount(loadJson<string[]>(FAVORITE_KEY, []).length);
		setResumeVersionCount(loadResumeVersions().length);
	}, []);

	useEffect(() => {
		reload();

		const onStorage = (event: StorageEvent) => {
			if (event.key?.startsWith("acs_")) {
				reload();
			}
		};

		const onRefresh = () => reload();

		window.addEventListener("storage", onStorage);
		window.addEventListener(DASHBOARD_REFRESH_EVENT, onRefresh);
		return () => {
			window.removeEventListener("storage", onStorage);
			window.removeEventListener(DASHBOARD_REFRESH_EVENT, onRefresh);
		};
	}, [reload]);

	const totalInterviews = interviews.length;
	const totalAttempts = attempts.length;
	const passedAttempts = attempts.filter((a) => a.success).length;
	const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
	const avgCpu = totalAttempts > 0 ? Math.round(attempts.reduce((s, a) => s + a.cpuTimeMs, 0) / totalAttempts) : 0;

	const latestDimensions = interviews.length > 0
		? interviews[interviews.length - 1].dimensions
		: null;

	const challengeIds = new Set(attempts.map((a) => a.challengeId));
	const uniqueChallenges = challengeIds.size;

	if (totalInterviews === 0 && totalAttempts === 0) {
		return null;
	}

	return (
		<section className="rounded-[28px] border border-amber-300/15 bg-amber-300/[0.04] p-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Training Dashboard</p>
					<h3 className="mt-2 text-lg font-semibold text-white">训练数据看板</h3>
				</div>
			</div>

			<div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{[
					{ label: "模拟面试", value: totalInterviews, unit: "次" },
					{ label: "手写提交", value: totalAttempts, unit: "次" },
					{ label: "通过率", value: passRate, unit: "%" },
					{ label: "题目覆盖", value: uniqueChallenges, unit: "题" },
					{ label: "收藏题目", value: favoriteCount, unit: "题" },
					{ label: "平均 CPU", value: avgCpu, unit: "ms" },
					{ label: "简历版本", value: resumeVersionCount, unit: "个" },
				].map((item) => (
					<div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-center">
						<p className="text-[10px] text-slate-500">{item.label}</p>
						<p className="mt-1 text-xl font-black text-white">{item.value}<span className="ml-0.5 text-xs font-normal text-slate-400">{item.unit}</span></p>
					</div>
				))}
			</div>

			{latestDimensions ? (
				<div className="mt-5">
					<p className="text-xs text-slate-400">最近面试能力画像</p>
					<RadarChart
						dimensions={latestDimensions}
					/>
				</div>
			) : null}

			{attempts.length > 0 ? (
				<div className="mt-5">
					<p className="text-xs text-slate-400">最近手写题通过趋势</p>
					<div className="mt-2 flex items-end gap-1">
						{attempts.slice(0, 20).reverse().map((a) => (
							<div
								key={a.id}
								className={`h-6 flex-1 rounded-sm ${a.success ? "bg-emerald-300/40" : "bg-red-300/30"}`}
								title={`${a.success ? "通过" : "失败"} ${a.passedCount}/${a.totalCount}`}
							/>
						))}
					</div>
					<div className="mt-1 flex justify-between text-[9px] text-slate-600">
						<span>最早</span>
						<span>最近</span>
					</div>
				</div>
			) : null}
		</section>
	);
}
