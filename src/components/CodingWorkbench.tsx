"use client";

import { useCallback, useMemo, useState } from "react";
import { codingChallenges, type CodingChallenge, type ChallengeCategory } from "@/data/coding-challenges";
import { runInSandbox, type SandboxResult } from "@/lib/sandbox";
import { fetchWithAiHeaders } from "@/lib/fetch-ai";
import { CodeEditor } from "@/components/CodeEditor";

type CodeReviewResult = {
	correctness: number;
	edgeCases: number;
	complexity: number;
	codeStyle: number;
	total: number;
	comment: string;
	suggestions: string[];
};

const difficultyLabels = ["", "\u2605", "\u2605\u2605", "\u2605\u2605\u2605"];
const frequencyLabels = ["", "\ud83d\udd25", "\ud83d\udd25\ud83d\udd25", "\ud83d\udd25\ud83d\udd25\ud83d\udd25"];

export function CodingWorkbench() {
	const [filter, setFilter] = useState<ChallengeCategory | "all">("all");
	const [selectedId, setSelectedId] = useState(codingChallenges[0].id);
	const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
		const map: Record<string, string> = {};
		for (const c of codingChallenges) {
			map[c.id] = c.skeleton;
		}
		return map;
	});
	const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
	const [isReviewing, setIsReviewing] = useState(false);
	const [reviewError, setReviewError] = useState("");

	const filteredChallenges = useMemo(
		() => filter === "all" ? codingChallenges : codingChallenges.filter((c) => c.category === filter),
		[filter],
	);

	const challenge = codingChallenges.find((c) => c.id === selectedId) as CodingChallenge;
	const code = codeMap[selectedId] ?? challenge.skeleton;

	const handleCodeChange = useCallback(
		(value: string) => {
			setCodeMap((prev) => ({ ...prev, [selectedId]: value }));
		},
		[selectedId],
	);

	async function handleRun() {
		setIsRunning(true);
		setSandboxResult(null);
		setReviewResult(null);
		setReviewError("");

		try {
			const result = await runInSandbox(code, challenge.testCode, challenge.skeleton);
			setSandboxResult(result);
		} finally {
			setIsRunning(false);
		}
	}

	async function handleAiReview() {
		if (!sandboxResult) return;

		setIsReviewing(true);
		setReviewError("");

		try {
			const response = await fetchWithAiHeaders("/api/code-review", {
				method: "POST",
				body: JSON.stringify({
					code,
					challengeTitle: challenge.title,
					challengeDescription: challenge.description,
					testsPassed: sandboxResult.success,
					testsTotal: sandboxResult.tests.length,
					testsPassedCount: sandboxResult.tests.filter((t) => t.passed).length,
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "AI 审查失败");
			}
			setReviewResult(data as CodeReviewResult);
		} catch (error) {
			setReviewError(
				error instanceof Error ? error.message : "AI 代码审查失败",
			);
		} finally {
			setIsReviewing(false);
		}
	}

	function handleReset() {
		setCodeMap((prev) => ({ ...prev, [selectedId]: challenge.skeleton }));
		setSandboxResult(null);
		setReviewResult(null);
		setReviewError("");
	}

	function handleSelectChallenge(id: string) {
		setSelectedId(id);
		setSandboxResult(null);
		setReviewResult(null);
		setReviewError("");
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[0.35fr_1fr]">
			<aside className="sticky top-4 flex max-h-[calc(100vh-6rem)] flex-col rounded-[28px] border border-white/10 bg-slate-950/65 p-4">
				<h2 className="mb-3 text-sm font-semibold text-slate-300">
					题目列表（{filteredChallenges.length} / {codingChallenges.length}）
				</h2>
				<div className="mb-3 flex gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
					{([["all", "全部"], ["handwrite", "手写题"], ["algorithm", "算法题"]] as const).map(([key, label]) => (
						<button
							key={key}
							type="button"
							onClick={() => setFilter(key)}
							className={`flex-1 rounded-full px-2 py-1.5 transition-colors ${
								filter === key
									? "bg-cyan-300/15 text-cyan-100"
									: "text-slate-400 hover:text-white"
							}`}
						>
							{label}
						</button>
					))}
				</div>
				<div className="flex-1 space-y-2 overflow-y-auto pr-1">
				{filteredChallenges.map((c, index) => {
					const isActive = c.id === selectedId;
					return (
						<button
							key={c.id}
							type="button"
							onClick={() => handleSelectChallenge(c.id)}
							className={`w-full rounded-2xl border p-3 text-left transition-all ${
								isActive
									? "border-cyan-300/50 bg-cyan-300/10"
									: "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
							}`}
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-sm font-medium text-white">
									{String(index + 1).padStart(2, "0")}. {c.title}
								</span>
							</div>
							<div className="mt-1 flex gap-3 text-[10px] text-slate-400">
								<span>难度 {difficultyLabels[c.difficulty]}</span>
								<span>频率 {frequencyLabels[c.frequency]}</span>
								<span>{c.timeLimit}min</span>
							</div>
						</button>
					);
				})}
				</div>
			</aside>

			<div className="space-y-5">
				<div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
					<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-xl font-semibold text-white">{challenge.title}</h2>
							<p className="mt-2 text-sm leading-7 text-slate-300">
								{challenge.description}
							</p>
						</div>
						<div className="flex flex-wrap gap-2 text-xs">
							<span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-100">
								限时 {challenge.timeLimit} 分钟
							</span>
							<span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
								难度 {difficultyLabels[challenge.difficulty]}
							</span>
						</div>
					</div>

					<CodeEditor value={code} onChange={handleCodeChange} />

					<div className="mt-4 flex flex-wrap gap-3">
						<button
							type="button"
							onClick={handleRun}
							disabled={isRunning}
							className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
						>
							{isRunning ? "运行中..." : "运行测试"}
						</button>
						<button
							type="button"
							onClick={handleAiReview}
							disabled={isReviewing || !sandboxResult}
							className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
						>
							{isReviewing ? "AI 审查中..." : "AI 代码审查"}
						</button>
						<button
							type="button"
							onClick={handleReset}
							className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
						>
							重置代码
						</button>
					</div>
				</div>

				{sandboxResult ? (
					<div className={`rounded-[28px] border p-5 ${
						sandboxResult.success
							? "border-emerald-300/20 bg-emerald-300/[0.06]"
							: "border-red-300/20 bg-red-300/[0.06]"
					}`}>
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-white">
								{sandboxResult.success ? "全部通过" : "未通过"}
							</h3>
							<span className="text-xs text-slate-400">
								{sandboxResult.duration}ms
							</span>
						</div>

						{sandboxResult.error ? (
							<p className="mt-3 rounded-xl bg-black/30 p-3 text-sm text-red-200">
								{sandboxResult.error}
							</p>
						) : null}

						{sandboxResult.tests.length > 0 ? (
							<div className="mt-3 space-y-1.5">
								{sandboxResult.tests.map((test) => (
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

						{sandboxResult.logs.length > 0 ? (
							<div className="mt-3">
								<p className="mb-1.5 text-xs text-slate-400">Console</p>
								<pre className="rounded-xl bg-black/30 p-3 text-xs leading-5 text-slate-300">
									{sandboxResult.logs.join("\n")}
								</pre>
							</div>
						) : null}
					</div>
				) : null}

				{reviewError ? (
					<div className="rounded-[28px] border border-red-300/20 bg-red-300/[0.06] p-5 text-sm text-red-100">
						{reviewError}
					</div>
				) : null}

				{reviewResult ? (
					<div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
						<h3 className="text-lg font-semibold text-white">AI 代码审查</h3>

						<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
							{[
								{ label: "正确性", value: reviewResult.correctness, max: 30 },
								{ label: "边界处理", value: reviewResult.edgeCases, max: 25 },
								{ label: "复杂度", value: reviewResult.complexity, max: 25 },
								{ label: "风格", value: reviewResult.codeStyle, max: 20 },
								{ label: "总分", value: reviewResult.total, max: 100 },
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

						{reviewResult.comment ? (
							<p className="mt-4 text-sm leading-7 text-slate-200">
								{reviewResult.comment}
							</p>
						) : null}

						{reviewResult.suggestions.length > 0 ? (
							<div className="mt-4">
								<p className="mb-2 text-sm font-medium text-cyan-200">
									改进建议
								</p>
								<ul className="space-y-1.5 text-sm leading-7 text-slate-300">
									{reviewResult.suggestions.map((s) => (
										<li key={s}>{"\u2022"} {s}</li>
									))}
								</ul>
							</div>
						) : null}
					</div>
				) : null}
			</div>
		</div>
	);
}
