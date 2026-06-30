import { describe, it, expect } from "vitest";
import {
	getSavedAnswer,
	selectRound,
	selectLatestAiScore,
	selectCurrentScore,
	selectAverageScore,
	selectCompletedCount,
	selectInquiryDepth,
	selectSummary,
	selectCanStartInterview,
	selectCanAdvance,
	selectFundamentalCount,
	selectGeneratedFundamentalCount,
} from "../interview-store";
import type { InterviewStore } from "../interview-store";
import { frontendFundamentalTopics, createOpeningRound } from "@/lib/interview-core";

function createBaseState(): InterviewStore {
	return {
		mode: "auto",
		interviewerRole: "gentle",
		position: "前端实习生",
		resumeText: "",
		fileStatus: "",
		isParsingFile: false,
		focusContext: "",
		phase: "idle",
		planSummary: "尚未基于简历生成面试计划。",
		topics: [],
		activeQuestion: 0,
		currentTopicIndex: 0,
		topicDepth: 0,
		answer: "",
		history: [],
		rounds: [],
		errorMessage: "",
		aiScores: [],
		reviewData: null,
		streamingReviewText: "",
		setMode: () => {},
		setInterviewerRole: () => {},
		setPosition: () => {},
		setResumeText: () => {},
		setAnswer: () => {},
		initFromStorage: () => {},
		handleFileChange: async () => {},
		handlePrepareInterview: async () => {},
		handleAnswerSubmit: async () => {},
		handleSwitchTopic: () => {},
		handleFinishInterview: async () => {},
		handleReset: () => {},
	};
}

describe("getSavedAnswer", () => {
	it("returns history entry when available", () => {
		expect(getSavedAnswer(["答案A", "答案B"], 2, "当前", 0)).toBe("答案A");
	});

	it("returns current answer for active question", () => {
		expect(getSavedAnswer([], 0, "当前答案", 0)).toBe("当前答案");
	});

	it("returns empty for non-active question without history", () => {
		expect(getSavedAnswer([], 0, "当前答案", 1)).toBe("");
	});

	it("returns empty when answer is whitespace only", () => {
		expect(getSavedAnswer([], 0, "   ", 0)).toBe("");
	});
});

describe("selectRound", () => {
	it("returns undefined when no rounds", () => {
		expect(selectRound(createBaseState())).toBeUndefined();
	});

	it("returns the active round", () => {
		const round = createOpeningRound(frontendFundamentalTopics[0]);
		const state = { ...createBaseState(), rounds: [round], activeQuestion: 0 };
		expect(selectRound(state)).toBe(round);
	});
});

describe("selectLatestAiScore", () => {
	it("returns null-ish when no scores", () => {
		expect(selectLatestAiScore(createBaseState())).toBeUndefined();
	});

	it("returns last non-null score", () => {
		const score = { total: 80, accuracy: 25, structure: 20, depth: 18, riskHandling: 10, reviewMindset: 7 };
		const state = { ...createBaseState(), aiScores: [null, score] };
		expect(selectLatestAiScore(state)).toBe(score);
	});
});

describe("selectCurrentScore", () => {
	it("falls back to local scoring when no AI scores", () => {
		const state = { ...createBaseState(), answer: "我做了一个项目" };
		const score = selectCurrentScore(state);
		expect(score.total).toBeGreaterThan(0);
		expect(score.accuracy).toBeGreaterThanOrEqual(0);
	});

	it("uses latest AI score when available", () => {
		const aiScore = { total: 85, accuracy: 28, structure: 22, depth: 20, riskHandling: 10, reviewMindset: 5 };
		const state = { ...createBaseState(), aiScores: [aiScore] };
		expect(selectCurrentScore(state).total).toBe(85);
	});
});

describe("selectAverageScore", () => {
	it("uses AI scores average when available", () => {
		const s1 = { total: 80, accuracy: 25, structure: 20, depth: 18, riskHandling: 10, reviewMindset: 7 };
		const s2 = { total: 60, accuracy: 18, structure: 15, depth: 12, riskHandling: 8, reviewMindset: 7 };
		const state = { ...createBaseState(), aiScores: [s1, s2] };
		expect(selectAverageScore(state)).toBe(70);
	});
});

describe("selectCompletedCount", () => {
	it("returns history length", () => {
		const state = { ...createBaseState(), history: ["a", "b", "c"] };
		expect(selectCompletedCount(state)).toBe(3);
	});
});

describe("selectInquiryDepth", () => {
	it("returns minimum 18 for empty history", () => {
		expect(selectInquiryDepth(createBaseState())).toBe(18);
	});

	it("increases with completed count", () => {
		const state = { ...createBaseState(), history: ["a", "b", "c", "d", "e"] };
		expect(selectInquiryDepth(state)).toBe(18 + 5 * 7);
	});

	it("caps at 100", () => {
		const state = { ...createBaseState(), history: Array(20).fill("x") };
		expect(selectInquiryDepth(state)).toBe(100);
	});
});

describe("selectSummary", () => {
	it("returns a string", () => {
		expect(typeof selectSummary(createBaseState())).toBe("string");
	});
});

describe("selectCanStartInterview", () => {
	it("returns false when resume is too short", () => {
		const state = { ...createBaseState(), resumeText: "短" };
		expect(selectCanStartInterview(state)).toBe(false);
	});

	it("returns true when resume is long enough", () => {
		const state = { ...createBaseState(), resumeText: "x".repeat(50) };
		expect(selectCanStartInterview(state)).toBe(true);
	});

	it("returns false when preparing", () => {
		const state = { ...createBaseState(), resumeText: "x".repeat(50), phase: "preparing" as const };
		expect(selectCanStartInterview(state)).toBe(false);
	});
});

describe("selectCanAdvance", () => {
	it("returns false without a round", () => {
		const state = { ...createBaseState(), answer: "有内容", phase: "interviewing" as const };
		expect(selectCanAdvance(state)).toBe(false);
	});

	it("returns false with empty answer", () => {
		const round = createOpeningRound(frontendFundamentalTopics[0]);
		const state = { ...createBaseState(), rounds: [round], answer: "", phase: "interviewing" as const };
		expect(selectCanAdvance(state)).toBe(false);
	});

	it("returns true with round and answer", () => {
		const round = createOpeningRound(frontendFundamentalTopics[0]);
		const state = { ...createBaseState(), rounds: [round], answer: "有内容", phase: "interviewing" as const };
		expect(selectCanAdvance(state)).toBe(true);
	});

	it("returns false when completed", () => {
		const round = createOpeningRound(frontendFundamentalTopics[0]);
		const state = { ...createBaseState(), rounds: [round], answer: "有内容", phase: "completed" as const };
		expect(selectCanAdvance(state)).toBe(false);
	});
});

describe("selectFundamentalCount", () => {
	it("returns 0 with no rounds", () => {
		expect(selectFundamentalCount(createBaseState())).toBe(0);
	});

	it("counts fundamental rounds with answers", () => {
		const round = createOpeningRound(frontendFundamentalTopics[0]);
		const state = {
			...createBaseState(),
			rounds: [round],
			history: ["有回答"],
			activeQuestion: 1,
		};
		expect(selectFundamentalCount(state)).toBe(1);
	});
});

describe("selectGeneratedFundamentalCount", () => {
	it("counts fundamental rounds regardless of answers", () => {
		const r1 = createOpeningRound(frontendFundamentalTopics[0]);
		const r2 = createOpeningRound(frontendFundamentalTopics[1]);
		const state = { ...createBaseState(), rounds: [r1, r2] };
		expect(selectGeneratedFundamentalCount(state)).toBe(2);
	});
});
