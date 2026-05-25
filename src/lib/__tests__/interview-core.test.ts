import { describe, it, expect } from "vitest";
import {
	createOpeningRound,
	scoreInterviewAnswer,
	getInterviewSummary,
	frontendFundamentalTopics,
} from "../interview-core";

describe("createOpeningRound", () => {
	it("creates a round from a topic with all required fields", () => {
		const topic = frontendFundamentalTopics[0];
		const round = createOpeningRound(topic);

		expect(round.id).toBe(topic.id);
		expect(round.focus).toBe(topic.focus);
		expect(round.dimension).toBe(topic.dimension);
		expect(round.question).toBe(topic.question);
		expect(round.boundary).toBe(topic.boundary);
		expect(round.feedback).toBeTruthy();
		expect(round.followUp).toBeTruthy();
		expect(round.trigger).toContain(topic.focus);
		expect(round.answerStandard).toContain(topic.boundary);
	});
});

describe("scoreInterviewAnswer", () => {
	it("returns low score for empty answer", () => {
		const score = scoreInterviewAnswer("", 0);

		expect(score.total).toBeLessThan(50);
		expect(score.accuracy).toBeGreaterThanOrEqual(0);
		expect(score.structure).toBeGreaterThanOrEqual(0);
		expect(score.depth).toBeGreaterThanOrEqual(0);
		expect(score.riskHandling).toBeGreaterThanOrEqual(0);
		expect(score.reviewMindset).toBeGreaterThanOrEqual(0);
	});

	it("gives higher score for structured answer with keywords", () => {
		const shortAnswer = "我做了一个项目";
		const detailedAnswer =
			"首先我负责了状态管理的架构设计，其次处理了异常边界和降级方案，最后通过性能指标验证了优化效果，并进行了复盘改进。";

		const shortScore = scoreInterviewAnswer(shortAnswer, 0);
		const detailedScore = scoreInterviewAnswer(detailedAnswer, 0);

		expect(detailedScore.total).toBeGreaterThan(shortScore.total);
	});

	it("caps total score at 96", () => {
		const maxAnswer =
			"首先其次最后因为所以场景方案结果异常边界失败取消重试降级兜底状态性能缓存协议架构复用抽象验证复盘优化重构指标验证改进" +
			"x".repeat(200);
		const score = scoreInterviewAnswer(maxAnswer, 10);

		expect(score.total).toBeLessThanOrEqual(96);
	});

	it("individual dimensions stay within their max bounds", () => {
		const answer =
			"首先其次最后异常降级状态性能缓存架构复盘优化重构指标" +
			"x".repeat(300);
		const score = scoreInterviewAnswer(answer, 5);

		expect(score.accuracy).toBeLessThanOrEqual(30);
		expect(score.structure).toBeLessThanOrEqual(25);
		expect(score.depth).toBeLessThanOrEqual(25);
		expect(score.riskHandling).toBeLessThanOrEqual(20);
		expect(score.reviewMindset).toBeLessThanOrEqual(15);
	});
});

describe("getInterviewSummary", () => {
	it("returns high-level summary for score >= 90", () => {
		const summary = getInterviewSummary(92);
		expect(summary).toContain("较强");
	});

	it("returns mid-level summary for score 75-89", () => {
		const summary = getInterviewSummary(80);
		expect(summary).toContain("还不错");
	});

	it("returns low-level summary for score < 75", () => {
		const summary = getInterviewSummary(60);
		expect(summary).toContain("补全");
	});
});

describe("frontendFundamentalTopics", () => {
	it("has at least 10 fundamental topics", () => {
		expect(frontendFundamentalTopics.length).toBeGreaterThanOrEqual(10);
	});

	it("each topic has required fields", () => {
		for (const topic of frontendFundamentalTopics) {
			expect(topic.id).toBeTruthy();
			expect(topic.focus).toBeTruthy();
			expect(topic.dimension).toBeTruthy();
			expect(topic.question).toBeTruthy();
			expect(topic.boundary).toBeTruthy();
		}
	});

	it("all topics have fundamental category or id prefix", () => {
		for (const topic of frontendFundamentalTopics) {
			const isFundamental =
				topic.category === "fundamental" ||
				topic.id.startsWith("fundamental-");
			expect(isFundamental).toBe(true);
		}
	});
});
