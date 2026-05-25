import { describe, it, expect } from "vitest";
import { buildReview, matchJd, polishProject } from "../analysis";

describe("buildReview", () => {
	it("returns score between 58 and 96", () => {
		const result = buildReview("一段普通的简历文本");
		expect(result.score).toBeGreaterThanOrEqual(58);
		expect(result.score).toBeLessThanOrEqual(96);
	});

	it("gives higher score for resume with project keywords", () => {
		const plain = buildReview("一段普通的文本");
		const rich = buildReview(
			"实习公司做了 React 项目，SSE 流式对话，上线部署，优化了 3 个指标",
		);
		expect(rich.score).toBeGreaterThan(plain.score);
	});

	it("returns strengths, risks, and suggestions arrays", () => {
		const result = buildReview("简历内容");
		expect(Array.isArray(result.strengths)).toBe(true);
		expect(Array.isArray(result.risks)).toBe(true);
		expect(Array.isArray(result.suggestions)).toBe(true);
		expect(result.strengths.length).toBeGreaterThan(0);
		expect(result.risks.length).toBeGreaterThan(0);
		expect(result.suggestions.length).toBeGreaterThan(0);
	});
});

describe("matchJd", () => {
	it("returns matched and missing keywords", () => {
		const jd = "需要熟悉 React、TypeScript 和性能优化";
		const resume = "我熟悉 React 和 TypeScript";
		const result = matchJd(jd, resume);

		expect(result.matchedKeywords).toContain("React");
		expect(result.matchedKeywords).toContain("TypeScript");
		expect(result.score).toBeGreaterThanOrEqual(55);
		expect(result.score).toBeLessThanOrEqual(96);
	});

	it("returns score between 55 and 96", () => {
		const result = matchJd("前端实习生", "我是计算机专业");
		expect(result.score).toBeGreaterThanOrEqual(55);
		expect(result.score).toBeLessThanOrEqual(96);
	});

	it("returns rewrite advice and interview directions", () => {
		const result = matchJd("React", "React");
		expect(result.rewriteAdvice.length).toBeGreaterThan(0);
		expect(result.interviewDirections.length).toBeGreaterThan(0);
	});
});

describe("polishProject", () => {
	it("returns polished text and arrays", () => {
		const result = polishProject("做了一个 AI 对话项目");
		expect(result.polished).toBeTruthy();
		expect(result.highlights.length).toBeGreaterThan(0);
		expect(result.followUps.length).toBeGreaterThan(0);
		expect(result.resumeBullets.length).toBeGreaterThan(0);
	});

	it("detects AI domain", () => {
		const result = polishProject("AI 模型 SSE 流式 Prompt");
		expect(result.polished).toContain("AI");
	});

	it("detects audio domain", () => {
		const result = polishProject("音乐播放器 audio 组件");
		expect(result.polished).toContain("音频");
	});
});
