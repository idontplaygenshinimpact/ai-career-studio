"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { codingChallenges, type ChallengeCategory } from "@/data/coding-challenges";
import { runInSandbox, type SandboxResult } from "@/lib/sandbox";
import { useAiRequest } from "@/hooks/useAiRequest";
import type { CodeReviewResult, CodingSnapshot, CodingAttempt } from "@/components/coding/types";
import {
	loadCodeMap,
	saveCodeMap,
	loadJson,
	saveJson,
	CUSTOM_TEST_STORAGE_KEY,
	FAVORITE_STORAGE_KEY,
	SNAPSHOT_STORAGE_KEY,
	ATTEMPT_STORAGE_KEY,
} from "@/components/coding/storage";
import { mergeTestCode } from "@/components/coding/test-utils";
import { refreshDashboard } from "@/components/TrainingDashboard";

export function useCodingWorkbench() {
	const [filter, setFilter] = useState<ChallengeCategory | "all">("all");
	const [selectedId, setSelectedId] = useState(codingChallenges[0].id);
	const [codeMap, setCodeMap] = useState<Record<string, string>>(loadCodeMap);
	const [customTests, setCustomTests] = useState<Record<string, string>>(() =>
		loadJson<Record<string, string>>(CUSTOM_TEST_STORAGE_KEY, {}),
	);
	const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
		loadJson<string[]>(FAVORITE_STORAGE_KEY, []),
	);
	const [snapshots, setSnapshots] = useState<CodingSnapshot[]>(() =>
		loadJson<CodingSnapshot[]>(SNAPSHOT_STORAGE_KEY, []),
	);
	const [attempts, setAttempts] = useState<CodingAttempt[]>(() =>
		loadJson<CodingAttempt[]>(ATTEMPT_STORAGE_KEY, []),
	);
	const [showCustomTests, setShowCustomTests] = useState(false);
	const aiReview = useAiRequest();

	useEffect(() => { saveCodeMap(codeMap); }, [codeMap]);
	useEffect(() => { saveJson(CUSTOM_TEST_STORAGE_KEY, customTests); }, [customTests]);
	useEffect(() => { saveJson(FAVORITE_STORAGE_KEY, favoriteIds); }, [favoriteIds]);
	useEffect(() => { saveJson(SNAPSHOT_STORAGE_KEY, snapshots.slice(0, 30)); }, [snapshots]);
	useEffect(() => { saveJson(ATTEMPT_STORAGE_KEY, attempts.slice(0, 50)); }, [attempts]);

	const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);

	const filteredChallenges = useMemo(() => {
		const base = filter === "all"
			? codingChallenges
			: codingChallenges.filter((c) => c.category === filter);
		return [...base].sort((a, b) => {
			const favA = favoriteIds.includes(a.id) ? 1 : 0;
			const favB = favoriteIds.includes(b.id) ? 1 : 0;
			return favB - favA;
		});
	}, [favoriteIds, filter]);

	const [visibleCount, setVisibleCount] = useState(20);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = loadMoreRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisibleCount((prev) => Math.min(prev + 20, filteredChallenges.length));
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [filteredChallenges.length]);

	const visibleChallenges = filteredChallenges.slice(0, visibleCount);
	const challenge = codingChallenges.find((c) => c.id === selectedId)!;
	const code = codeMap[selectedId] ?? challenge.skeleton;
	const customTest = customTests[selectedId] ?? "";
	const challengeSnapshots = snapshots.filter((s) => s.challengeId === selectedId);
	const challengeAttempts = attempts.filter((a) => a.challengeId === selectedId);
	const isFavorite = favoriteIds.includes(selectedId);
	const favoriteCount = favoriteIds.length;
	const latestAttempt = challengeAttempts[0];

	const handleCodeChange = useCallback(
		(value: string) => { setCodeMap((prev) => ({ ...prev, [selectedId]: value })); },
		[selectedId],
	);

	function clearResultState() {
		setSandboxResult(null);
		setReviewResult(null);
		aiReview.setError("");
		aiReview.setStatus("");
	}

	async function handleRun() {
		setIsRunning(true);
		clearResultState();
		try {
			const result = await runInSandbox(code, mergeTestCode(challenge, customTest), challenge.skeleton);
			setSandboxResult(result);
			setAttempts((prev) => [{
				id: `attempt-${Date.now()}`,
				challengeId: selectedId,
				createdAt: new Date().toISOString(),
				success: result.success,
				passedCount: result.tests.filter((t) => t.passed).length,
				totalCount: result.tests.length,
				duration: result.duration,
				cpuTimeMs: result.perf.cpuTimeMs,
				error: result.error,
			}, ...prev].slice(0, 50));
		} finally {
			setIsRunning(false);
			refreshDashboard();
		}
	}

	async function handleAiReview(reviewMode: "full" | "explain-failure" = "full") {
		if (!sandboxResult) return;
		aiReview.setError("");
		const response = await aiReview.run("/api/code-review", {
			method: "POST",
			timeoutMs: 35_000,
			retries: 1,
			status: reviewMode === "explain-failure" ? "正在分析失败用例..." : "正在请求 AI 代码审查...",
			body: JSON.stringify({
				code,
				challengeTitle: challenge.title,
				challengeDescription: challenge.description,
				testsPassed: sandboxResult.success,
				testsTotal: sandboxResult.tests.length,
				testsPassedCount: sandboxResult.tests.filter((t) => t.passed).length,
				failedTests: sandboxResult.tests.filter((t) => !t.passed).map((t) => t.label),
				consoleLogs: sandboxResult.logs,
				customTestCode: customTest,
				reviewMode,
			}),
		});
		if (!response) return;
		const data = await response.json();
		if (!response.ok) {
			aiReview.setError(data.error || "AI 审查失败");
			return;
		}
		setReviewResult(data as CodeReviewResult);
		aiReview.setStatus("AI 审查完成");
	}

	function handleReset() {
		setCodeMap((prev) => ({ ...prev, [selectedId]: challenge.skeleton }));
		clearResultState();
	}

	function handleSelectChallenge(id: string) {
		setSelectedId(id);
		clearResultState();
	}

	function handleFilterChange(next: ChallengeCategory | "all") {
		setFilter(next);
		setVisibleCount(20);
	}

	function handleToggleFavorite() {
		setFavoriteIds((prev) =>
			prev.includes(selectedId)
				? prev.filter((id) => id !== selectedId)
				: [selectedId, ...prev],
		);
		requestAnimationFrame(refreshDashboard);
	}

	function handleSaveSnapshot() {
		setSnapshots((prev) => [{
			id: `snapshot-${Date.now()}`,
			challengeId: selectedId,
			createdAt: new Date().toISOString(),
			code,
		}, ...prev].slice(0, 30));
	}

	function handleRestoreSnapshot(snapshot: CodingSnapshot) {
		setCodeMap((prev) => ({ ...prev, [selectedId]: snapshot.code }));
		setSandboxResult(null);
		setReviewResult(null);
		aiReview.setError("");
	}

	function handleCustomTestChange(value: string) {
		setCustomTests((prev) => ({ ...prev, [selectedId]: value }));
	}

	return {
		filter,
		selectedId,
		challenge,
		code,
		customTest,
		showCustomTests,
		setShowCustomTests,
		filteredChallenges,
		visibleChallenges,
		visibleCount,
		loadMoreRef,
		challengeSnapshots,
		challengeAttempts,
		isFavorite,
		favoriteCount,
		latestAttempt,
		sandboxResult,
		isRunning,
		reviewResult,
		aiReview,
		handleCodeChange,
		handleRun,
		handleAiReview,
		handleReset,
		handleSelectChallenge,
		handleFilterChange,
		handleToggleFavorite,
		handleSaveSnapshot,
		handleRestoreSnapshot,
		handleCustomTestChange,
	};
}
