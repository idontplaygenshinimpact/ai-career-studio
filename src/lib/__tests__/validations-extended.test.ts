import { describe, it, expect } from "vitest";
import {
	jdMatchRequestSchema,
	interviewAiRequestSchema,
	codeReviewRequestSchema,
} from "../validations";

describe("codeReviewRequestSchema", () => {
	it("accepts valid code review request", () => {
		const result = codeReviewRequestSchema.safeParse({
			code: "function debounce(fn, delay) { let timer; return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); }; }",
			challengeTitle: "手写防抖 debounce",
			challengeDescription: "事件触发后 delay 毫秒才执行",
			testsPassed: true,
			testsTotal: 4,
			testsPassedCount: 4,
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing code", () => {
		const result = codeReviewRequestSchema.safeParse({
			challengeTitle: "test",
			challengeDescription: "test",
			testsPassed: true,
			testsTotal: 0,
			testsPassedCount: 0,
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty code", () => {
		const result = codeReviewRequestSchema.safeParse({
			code: "",
			challengeTitle: "test",
			challengeDescription: "test",
			testsPassed: false,
			testsTotal: 1,
			testsPassedCount: 0,
		});
		expect(result.success).toBe(false);
	});

	it("rejects non-number testsTotal", () => {
		const result = codeReviewRequestSchema.safeParse({
			code: "code",
			challengeTitle: "test",
			challengeDescription: "test",
			testsPassed: true,
			testsTotal: "3",
			testsPassedCount: 3,
		});
		expect(result.success).toBe(false);
	});
});

describe("interviewAiRequestSchema round validation", () => {
	it("accepts round with valid currentRound", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "round",
			resumeText: "some resume",
			currentRound: {
				id: "test",
				focus: "SSE",
				dimension: "network",
				question: "How does SSE work?",
				boundary: "only SSE",
				feedback: "good",
				followUp: "next",
				trigger: "from resume",
				answerStandard: "need 3 points",
			},
		});
		expect(result.success).toBe(true);
	});

	it("rejects round missing currentRound", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "round",
			resumeText: "some resume",
		});
		expect(result.success).toBe(false);
	});
});

describe("jdMatchRequestSchema edge cases", () => {
	it("rejects when jd is exactly 9 chars", () => {
		const result = jdMatchRequestSchema.safeParse({
			jd: "123456789",
			resume: "some long resume text here",
		});
		expect(result.success).toBe(false);
	});

	it("accepts when jd is exactly 10 chars", () => {
		const result = jdMatchRequestSchema.safeParse({
			jd: "1234567890",
			resume: "some long resume text here",
		});
		expect(result.success).toBe(true);
	});
});
