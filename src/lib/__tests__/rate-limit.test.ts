import { describe, expect, it, vi } from "vitest";

describe("checkRateLimit", () => {
	it("allows requests within the window and blocks after the limit", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-27T00:00:00.000Z"));
		const { checkRateLimit } = await import("../rate-limit");
		const request = new Request("https://example.com/api", {
			headers: { "x-forwarded-for": "203.0.113.10" },
		});

		for (let i = 0; i < 30; i++) {
			expect(checkRateLimit(request).allowed).toBe(true);
		}

		const blocked = checkRateLimit(request);
		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfterMs).toBeGreaterThan(0);

		vi.advanceTimersByTime(60_001);
		expect(checkRateLimit(request).allowed).toBe(true);
		vi.useRealTimers();
	});

	it("tracks different forwarded IPs independently", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-27T01:00:00.000Z"));
		const { checkRateLimit } = await import("../rate-limit");
		const first = new Request("https://example.com/api", {
			headers: { "x-forwarded-for": "198.51.100.1" },
		});
		const second = new Request("https://example.com/api", {
			headers: { "x-forwarded-for": "198.51.100.2" },
		});

		for (let i = 0; i < 30; i++) {
			expect(checkRateLimit(first).allowed).toBe(true);
		}

		expect(checkRateLimit(first).allowed).toBe(false);
		expect(checkRateLimit(second).allowed).toBe(true);
		vi.useRealTimers();
	});
});
