import { describe, expect, it } from "vitest";
import { validateAiBaseUrl } from "../ai-client";

describe("validateAiBaseUrl", () => {
	it("accepts public HTTPS OpenAI-compatible endpoints", () => {
		expect(validateAiBaseUrl("https://api.deepseek.com/v1/")).toBe("https://api.deepseek.com/v1");
		expect(validateAiBaseUrl("https://api.openai.com/v1?debug=1#token")).toBe("https://api.openai.com/v1");
	});

	it("rejects non-HTTPS endpoints", () => {
		expect(() => validateAiBaseUrl("http://api.example.com/v1")).toThrow("HTTPS");
	});

	it("rejects localhost and private network endpoints", () => {
		const unsafeUrls = [
			"https://localhost:11434/v1",
			"https://127.0.0.1/v1",
			"https://10.0.0.8/v1",
			"https://172.16.0.2/v1",
			"https://192.168.1.10/v1",
			"https://169.254.1.1/v1",
			"https://[::1]/v1",
			"https://[fd00::1]/v1",
		];

		for (const url of unsafeUrls) {
			expect(() => validateAiBaseUrl(url)).toThrow("内网地址");
		}
	});

	it("rejects URLs with embedded credentials", () => {
		expect(() => validateAiBaseUrl("https://user:pass@api.example.com/v1")).toThrow("用户名或密码");
	});
});
