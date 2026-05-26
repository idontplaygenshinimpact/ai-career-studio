import { describe, it, expect } from "vitest";
import {
	getSavedAnswer,
	selectCurrentScore,
	selectAverageScore,
	selectCanStartInterview,
	selectCanAdvance,
	selectReportMarkdown,
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
		isPreparing: false,
		planSummary: "尚未基于简历生成面试计划。",
		topics: [],
		activeQuestion: 0,
		currentTopicIndex: 0,
		topicDepth: 0,
		answer: "",
		history: [],
		rounds: [],
		isAdvancing: false,
		isCompleted: false,
		errorMessage: "",
		aiScores: [],
		reviewData: null,
		isGeneratingReview: false,
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

describe("selectReportMarkdown", () => {
	it("contains position and mode info", () => {
		const state = { ...createBaseState(), position: "React实习", mode: "auto" as const };
		const md = selectReportMarkdown(state);
		expect(md).toContain("React实习");
		expect(md).toContain("连贯追问模式");
	});

	it("includes round details when rounds exist", () => {
		const round = createOpeningRound(frontendFundamentalTopics[0]);
		const state = {
			...createBaseState(),
			rounds: [round],
			history: ["我的回答内容"],
			activeQuestion: 1,
		};
		const md = selectReportMarkdown(state);
		expect(md).toContain("追问 1");
		expect(md).toContain(round.focus);
	});
});

describe("selectCanStartInterview edge cases", () => {
	it("returns false when isParsingFile is true", () => {
		const state = { ...createBaseState(), resumeText: "x".repeat(50), isParsingFile: true };
		expect(selectCanStartInterview(state)).toBe(false);
	});

	it("returns false when exactly 39 chars", () => {
		const state = { ...createBaseState(), resumeText: "x".repeat(39) };
		expect(selectCanStartInterview(state)).toBe(false);
	});

	it("returns true when exactly 40 chars", () => {
		const state = { ...createBaseState(), resumeText: "x".repeat(40) };
		expect(selectCanStartInterview(state)).toBe(true);
	});
});

describe("selectCanAdvance edge cases", () => {
	it("returns false when isAdvancing", () => {
		const round = createOpeningRound(frontendFundamentalTopics[0]);
		const state = { ...createBaseState(), rounds: [round], answer: "yes", isAdvancing: true };
		expect(selectCanAdvance(state)).toBe(false);
	});

	it("returns false when answer is only whitespace", () => {
		const round = createOpeningRound(frontendFundamentalTopics[0]);
		const state = { ...createBaseState(), rounds: [round], answer: "   \n\t  " };
		expect(selectCanAdvance(state)).toBe(false);
	});
});

describe("selectAverageScore edge cases", () => {
	it("returns currentScore total when no history and no AI scores", () => {
		const state = createBaseState();
		const avg = selectAverageScore(state);
		expect(avg).toBeGreaterThanOrEqual(0);
		expect(avg).toBeLessThanOrEqual(100);
	});

	it("uses local scoring when mixing history entries", () => {
		const state = {
			...createBaseState(),
			history: ["short", "a detailed answer with architecture and performance optimization and error handling"],
			isCompleted: true,
		};
		const avg = selectAverageScore(state);
		expect(avg).toBeGreaterThan(0);
	});
});

describe("getSavedAnswer edge cases", () => {
	it("returns answer for active question even when history has gaps", () => {
		expect(getSavedAnswer(["a"], 2, "current", 2)).toBe("current");
	});

	it("returns history for completed questions beyond active", () => {
		expect(getSavedAnswer(["a", "b", "c"], 5, "current", 1)).toBe("b");
	});
});
