import { describe, it, expect } from "vitest";
import {
	resumeReviewRequestSchema,
	jdMatchRequestSchema,
	projectPolishRequestSchema,
	interviewAiRequestSchema,
} from "../validations";

describe("resumeReviewRequestSchema", () => {
	it("accepts valid resume", () => {
		const result = resumeReviewRequestSchema.safeParse({ resume: "这是一份超过二十个字的简历内容用于测试校验逻辑" });
		expect(result.success).toBe(true);
	});

	it("rejects missing resume", () => {
		const result = resumeReviewRequestSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects too short resume", () => {
		const result = resumeReviewRequestSchema.safeParse({ resume: "短" });
		expect(result.success).toBe(false);
	});

	it("rejects non-string resume", () => {
		const result = resumeReviewRequestSchema.safeParse({ resume: 123 });
		expect(result.success).toBe(false);
	});
});

describe("jdMatchRequestSchema", () => {
	it("accepts valid jd and resume", () => {
		const result = jdMatchRequestSchema.safeParse({
			jd: "需要熟悉 React 和 TypeScript",
			resume: "我熟悉 React 和 TypeScript",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing jd", () => {
		const result = jdMatchRequestSchema.safeParse({ resume: "有简历内容超过十个字" });
		expect(result.success).toBe(false);
	});

	it("rejects too short jd", () => {
		const result = jdMatchRequestSchema.safeParse({ jd: "短", resume: "有简历内容超过十个字" });
		expect(result.success).toBe(false);
	});

	it("rejects missing resume", () => {
		const result = jdMatchRequestSchema.safeParse({ jd: "需要熟悉 React 和 TypeScript" });
		expect(result.success).toBe(false);
	});
});

describe("projectPolishRequestSchema", () => {
	it("accepts valid project", () => {
		const result = projectPolishRequestSchema.safeParse({ project: "基于 React 做了一个 AI 对话项目" });
		expect(result.success).toBe(true);
	});

	it("rejects missing project", () => {
		const result = projectPolishRequestSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects too short project", () => {
		const result = projectPolishRequestSchema.safeParse({ project: "短" });
		expect(result.success).toBe(false);
	});
});

describe("interviewAiRequestSchema", () => {
	it("accepts valid plan request", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "plan",
			resumeText: "这是一份真实的简历内容",
		});
		expect(result.success).toBe(true);
	});

	it("rejects plan with empty resumeText", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "plan",
			resumeText: "",
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid review request", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "review",
			rounds: [
				{ focus: "HTTP", question: "问题", answer: "回答", dimension: "网络" },
			],
		});
		expect(result.success).toBe(true);
	});

	it("rejects review with empty rounds", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "review",
			rounds: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects unknown action", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "unknown",
			resumeText: "内容",
		});
		expect(result.success).toBe(false);
	});

	it("rejects round without currentRound", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "round",
			resumeText: "简历内容",
		});
		expect(result.success).toBe(false);
	});

	it("validates interviewerRole enum", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "plan",
			resumeText: "简历内容",
			interviewerRole: "invalid-role",
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid interviewerRole", () => {
		const result = interviewAiRequestSchema.safeParse({
			action: "plan",
			resumeText: "简历内容",
			interviewerRole: "pressure",
		});
		expect(result.success).toBe(true);
	});
});
