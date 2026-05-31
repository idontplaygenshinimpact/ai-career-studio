/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAiRequest } from "../useAiRequest";

describe("useAiRequest", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("returns initial state", () => {
		const { result } = renderHook(() => useAiRequest());
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBe("");
		expect(result.current.status).toBe("");
	});

	it("sets isLoading during request", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useAiRequest());

		let promise: Promise<Response | null>;
		act(() => {
			promise = result.current.run("/api/test");
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.status).toBe("AI 请求处理中...");

		await act(async () => {
			await promise;
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.status).toBe("AI 请求完成");
	});

	it("returns response on success", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useAiRequest());

		let response: Response | null = null;
		await act(async () => {
			response = await result.current.run("/api/test");
		});

		expect(response).not.toBeNull();
		expect(response!.status).toBe(200);
		expect(result.current.error).toBe("");
	});

	it("sets error on network failure", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

		const { result } = renderHook(() => useAiRequest());

		await act(async () => {
			const response = await result.current.run("/api/test");
			expect(response).toBeNull();
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).not.toBe("");
	});

	it("supports cancel", async () => {
		vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
			init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
		})));

		const { result } = renderHook(() => useAiRequest());

		act(() => {
			result.current.run("/api/test", { timeoutMs: 60_000 });
		});

		expect(result.current.isLoading).toBe(true);

		act(() => {
			result.current.cancel("用户取消");
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.status).toBe("用户取消");
	});

	it("supports custom status via run option", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useAiRequest());

		await act(async () => {
			await result.current.run("/api/test", { status: "正在分析..." });
		});

		expect(result.current.status).toBe("AI 请求完成");
	});

	it("setStatus and setError work", () => {
		const { result } = renderHook(() => useAiRequest());

		act(() => { result.current.setStatus("custom status"); });
		expect(result.current.status).toBe("custom status");

		act(() => { result.current.setError("custom error"); });
		expect(result.current.error).toBe("custom error");
	});
});
