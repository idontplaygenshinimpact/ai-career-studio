/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithAiHeaders, AiRequestError } from "../fetch-ai";
import { saveAiSettings } from "../storage";

describe("fetchWithAiHeaders", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("injects user AI settings into request headers", async () => {
		saveAiSettings({
			apiKey: "sk-test",
			baseUrl: "https://api.example.com/v1",
			model: "demo-model",
		});
		const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		await fetchWithAiHeaders("/api/demo", { method: "POST" });

		const init = fetchMock.mock.calls[0][1] as RequestInit;
		const headers = init.headers as Headers;
		expect(headers.get("Content-Type")).toBe("application/json");
		expect(headers.get("x-ai-api-key")).toBe("sk-test");
		expect(headers.get("x-ai-base-url")).toBe("https://api.example.com/v1");
		expect(headers.get("x-ai-model")).toBe("demo-model");
	});

	it("retries 429 responses and reports retry status", async () => {
		const onRetry = vi.fn();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
			.mockResolvedValueOnce(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		const promise = fetchWithAiHeaders("/api/demo", {
			retries: 1,
			retryDelayMs: 10,
			onRetry,
		});
		await vi.advanceTimersByTimeAsync(10);
		const response = await promise;

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(onRetry).toHaveBeenCalledWith(1, "HTTP 429");
	});

	it("throws timeout error when request exceeds timeout", async () => {
		vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
			init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
		})));

		const promise = fetchWithAiHeaders("/api/demo", { timeoutMs: 5 });
		const assertion = expect(promise).rejects.toMatchObject({
			code: "timeout",
			name: "AiRequestError",
		});
		await vi.advanceTimersByTimeAsync(5);

		await assertion;
	});

	it("throws aborted error for external cancellation", async () => {
		const controller = new AbortController();
		vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
			init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
		})));

		const promise = fetchWithAiHeaders("/api/demo", {
			signal: controller.signal,
			timeoutMs: 1000,
		});
		const instanceAssertion = expect(promise).rejects.toBeInstanceOf(AiRequestError);
		const codeAssertion = expect(promise).rejects.toMatchObject({ code: "aborted" });
		controller.abort();

		await instanceAssertion;
		await codeAssertion;
	});
});
