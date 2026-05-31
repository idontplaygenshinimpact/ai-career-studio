/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCodingWorkbench } from "../useCodingWorkbench";

vi.mock("@/lib/sandbox", () => ({
	runInSandbox: vi.fn().mockResolvedValue({
		success: true,
		tests: [{ passed: true, label: "test1" }],
		logs: [],
		error: null,
		duration: 15,
		perf: { cpuTimeMs: 5, heapEstimateKB: 100, timedOut: false, memoryExceeded: false },
	}),
}));

vi.mock("@/components/TrainingDashboard", () => ({
	refreshDashboard: vi.fn(),
}));

describe("useCodingWorkbench", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("initializes with first challenge selected", () => {
		const { result } = renderHook(() => useCodingWorkbench());
		expect(result.current.challenge).toBeDefined();
		expect(result.current.challenge.id).toBeTruthy();
		expect(result.current.code).toBe(result.current.challenge.skeleton);
	});

	it("changes code for selected challenge", () => {
		const { result } = renderHook(() => useCodingWorkbench());
		act(() => {
			result.current.handleCodeChange("function test() {}");
		});
		expect(result.current.code).toBe("function test() {}");
	});

	it("toggles favorite", () => {
		const { result } = renderHook(() => useCodingWorkbench());
		const initialFav = result.current.isFavorite;
		act(() => {
			result.current.handleToggleFavorite();
		});
		expect(result.current.isFavorite).toBe(!initialFav);
		act(() => {
			result.current.handleToggleFavorite();
		});
		expect(result.current.isFavorite).toBe(initialFav);
	});

	it("resets code to skeleton", () => {
		const { result } = renderHook(() => useCodingWorkbench());
		act(() => {
			result.current.handleCodeChange("custom code");
		});
		expect(result.current.code).toBe("custom code");
		act(() => {
			result.current.handleReset();
		});
		expect(result.current.code).toBe(result.current.challenge.skeleton);
	});

	it("switches challenge and clears result state", () => {
		const { result } = renderHook(() => useCodingWorkbench());
		const challenges = result.current.filteredChallenges;
		if (challenges.length > 1) {
			const secondId = challenges[1].id;
			act(() => {
				result.current.handleSelectChallenge(secondId);
			});
			expect(result.current.selectedId).toBe(secondId);
			expect(result.current.sandboxResult).toBeNull();
			expect(result.current.reviewResult).toBeNull();
		}
	});

	it("saves and restores snapshots", () => {
		const { result } = renderHook(() => useCodingWorkbench());
		act(() => {
			result.current.handleCodeChange("snapshot code");
		});
		act(() => {
			result.current.handleSaveSnapshot();
		});
		expect(result.current.challengeSnapshots.length).toBe(1);
		expect(result.current.challengeSnapshots[0].code).toBe("snapshot code");

		act(() => {
			result.current.handleCodeChange("modified");
		});
		act(() => {
			result.current.handleRestoreSnapshot(result.current.challengeSnapshots[0]);
		});
		expect(result.current.code).toBe("snapshot code");
	});

	it("runs sandbox and records attempt", async () => {
		const { result } = renderHook(() => useCodingWorkbench());
		await act(async () => {
			await result.current.handleRun();
		});
		expect(result.current.sandboxResult).not.toBeNull();
		expect(result.current.sandboxResult?.success).toBe(true);
		expect(result.current.challengeAttempts.length).toBe(1);
		expect(result.current.challengeAttempts[0].success).toBe(true);
	});

	it("filters challenges by category", () => {
		const { result } = renderHook(() => useCodingWorkbench());
		const allCount = result.current.filteredChallenges.length;
		act(() => {
			result.current.handleFilterChange("handwrite");
		});
		expect(result.current.filteredChallenges.length).toBeLessThanOrEqual(allCount);
		expect(result.current.filteredChallenges.every((c) => c.category === "handwrite")).toBe(true);
	});
});
