/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import {
	calcFingerprint,
	calcSimilarity,
	normalize,
	diffLines,
	aggregateSuggestions,
	saveResumeVersion,
	loadResumeLines,
	loadResumeVersions,
	deleteResumeVersion,
} from "../resume-versions";
import { generateComprehensiveAdvice } from "../comprehensive-advice";

function clearStorage() {
	localStorage.clear();
}

describe("normalize", () => {
	it("removes whitespace and truncates to 200 chars", () => {
		const input = "  hello   world\n\tfoo  ";
		expect(normalize(input)).toBe("helloworldfoo");
	});

	it("truncates long text", () => {
		const input = "a".repeat(300);
		expect(normalize(input).length).toBe(200);
	});
});

describe("calcFingerprint", () => {
	it("returns same hash for same text", () => {
		expect(calcFingerprint("hello world")).toBe(calcFingerprint("hello world"));
	});

	it("returns different hash for different text", () => {
		expect(calcFingerprint("hello")).not.toBe(calcFingerprint("world"));
	});

	it("ignores whitespace differences", () => {
		expect(calcFingerprint("hello world")).toBe(calcFingerprint("hello   world"));
	});
});

describe("calcSimilarity", () => {
	it("returns 1 for identical text", () => {
		expect(calcSimilarity("hello", "hello")).toBe(1);
	});

	it("returns 0 for empty text", () => {
		expect(calcSimilarity("", "hello")).toBe(0);
		expect(calcSimilarity("hello", "")).toBe(0);
	});

	it("returns value between 0 and 1 for partially similar text", () => {
		const sim = calcSimilarity("abcdef", "abcxyz");
		expect(sim).toBeGreaterThan(0);
		expect(sim).toBeLessThan(1);
	});

	it("returns higher similarity for more similar text", () => {
		const high = calcSimilarity("abcdefgh", "abcdefgx");
		const low = calcSimilarity("abcdefgh", "xyzwvuts");
		expect(high).toBeGreaterThan(low);
	});
});

describe("diffLines", () => {
	it("handles identical text", () => {
		const result = diffLines("a\nb\nc", "a\nb\nc");
		expect(result.every((l) => l.type === "unchanged")).toBe(true);
		expect(result.length).toBe(3);
	});

	it("detects added lines", () => {
		const result = diffLines("a\nb", "a\nb\nc");
		const added = result.filter((l) => l.type === "added");
		expect(added.length).toBe(1);
		expect(added[0].content).toBe("c");
	});

	it("detects removed lines", () => {
		const result = diffLines("a\nb\nc", "a\nc");
		const removed = result.filter((l) => l.type === "removed");
		expect(removed.length).toBe(1);
		expect(removed[0].content).toBe("b");
	});

	it("handles duplicate lines correctly", () => {
		const result = diffLines("a\na\nb", "a\na\nc");
		const unchanged = result.filter((l) => l.type === "unchanged");
		expect(unchanged.length).toBe(2);
	});

	it("handles complete replacement", () => {
		const result = diffLines("x\ny", "a\nb");
		const removed = result.filter((l) => l.type === "removed");
		const added = result.filter((l) => l.type === "added");
		expect(removed.length).toBe(2);
		expect(added.length).toBe(2);
	});

	it("handles empty texts", () => {
		expect(diffLines("", "").length).toBe(1);
		const addResult = diffLines("", "a");
		expect(addResult.filter((l) => l.type === "added").length).toBe(1);
	});
});

describe("saveResumeVersion + dedup", () => {
	it("creates new line and version", () => {
		clearStorage();
		const { line, version } = saveResumeVersion({
			text: "合肥工业大学计算机专业",
			source: "resume-review",
			scores: { resumeReview: 75 },
			suggestions: [],
		});
		expect(line.id).toBeTruthy();
		expect(version.lineId).toBe(line.id);
		expect(loadResumeLines().length).toBe(1);
		expect(loadResumeVersions().length).toBe(1);
	});

	it("deduplicates same text + source", () => {
		clearStorage();
		saveResumeVersion({
			text: "合肥工业大学计算机专业",
			source: "resume-review",
			scores: { resumeReview: 75 },
			suggestions: [],
		});
		saveResumeVersion({
			text: "合肥工业大学计算机专业",
			source: "resume-review",
			scores: { resumeReview: 82 },
			suggestions: [{ source: "resume-review", content: "加量化", priority: "medium" }],
		});
		expect(loadResumeVersions().length).toBe(1);
		const v = loadResumeVersions()[0];
		expect(v.scores.resumeReview).toBe(82);
		expect(v.suggestions.length).toBe(1);
	});

	it("creates new version for different source", () => {
		clearStorage();
		saveResumeVersion({ text: "合肥工业大学计算机专业", source: "resume-review", scores: {} });
		saveResumeVersion({ text: "合肥工业大学计算机专业", source: "jd-match", scores: { jdMatch: 80 } });
		expect(loadResumeVersions().length).toBe(2);
	});

	it("stores project-polish versions and suggestions", () => {
		clearStorage();
		saveResumeVersion({
			text: "优化后项目描述\n- 基于 TypeScript 拆分状态管理",
			source: "project-polish",
			suggestions: [
				{ source: "project-polish", content: "补充项目量化结果", priority: "medium" },
			],
		});

		const versions = loadResumeVersions();
		expect(versions).toHaveLength(1);
		expect(versions[0].source).toBe("project-polish");
		expect(versions[0].suggestions[0].source).toBe("project-polish");
	});

	it("creates new version for modified text", () => {
		clearStorage();
		saveResumeVersion({ text: "合肥工业大学计算机专业 v1", source: "resume-review", scores: {} });
		saveResumeVersion({ text: "合肥工业大学计算机专业 v2 改了项目描述", source: "resume-review", scores: {} });
		expect(loadResumeVersions().length).toBe(2);
		expect(loadResumeLines().length).toBe(1);
	});
});

describe("deleteResumeVersion", () => {
	it("removes a version by id", () => {
		clearStorage();
		const { version } = saveResumeVersion({ text: "test", source: "manual", scores: {} });
		expect(loadResumeVersions().length).toBe(1);
		deleteResumeVersion(version.id);
		expect(loadResumeVersions().length).toBe(0);
	});
});

describe("aggregateSuggestions", () => {
	it("deduplicates and promotes repeated suggestions", () => {
		clearStorage();
		const { line } = saveResumeVersion({
			text: "简历内容 A",
			source: "resume-review",
			scores: {},
			suggestions: [
				{ source: "resume-review", content: "缺少 TypeScript 经验", priority: "medium" },
				{ source: "resume-review", content: "项目缺乏量化", priority: "low" },
			],
		});
		saveResumeVersion({
			text: "简历内容 A 改了一点",
			source: "jd-match",
			scores: {},
			suggestions: [
				{ source: "jd-match", content: "缺少 TypeScript 经验", priority: "medium" },
			],
		});
		const result = aggregateSuggestions(line.id);
		const tsItem = result.find((s) => s.content.startsWith("缺少 TypeScript"));
		expect(tsItem?.priority).toBe("medium");
		expect(result.length).toBe(2);
	});
});

describe("generateComprehensiveAdvice", () => {
	it("returns '建议先集中训练' when no data", () => {
		clearStorage();
		const advice = generateComprehensiveAdvice();
		expect(advice.readiness).toBe("建议先集中训练");
		expect(advice.resumeScore).toBeNull();
		expect(advice.interviewAvg).toBeNull();
		expect(advice.codingPassRate).toBeNull();
	});

	it("returns non-null resume score when version exists", () => {
		clearStorage();
		saveResumeVersion({
			text: "合肥工业大学计算机专业大三在读",
			source: "resume-review",
			scores: { resumeReview: 85 },
		});
		const advice = generateComprehensiveAdvice();
		expect(advice.resumeScore).toBe(85);
	});

	it("generates next actions", () => {
		clearStorage();
		const advice = generateComprehensiveAdvice();
		expect(advice.nextActions.length).toBeGreaterThan(0);
	});

	it("marks user as ready when resume, interview, and coding are strong", () => {
		clearStorage();
		saveResumeVersion({
			text: "前端校招简历，包含 React、TypeScript、性能优化和测试覆盖",
			source: "resume-review",
			scores: { resumeReview: 88 },
		});
		localStorage.setItem("acs_interview_history", JSON.stringify([
			{ id: "i1", date: "2026-05-27", position: "前端实习生", mode: "auto", averageScore: 82, roundCount: 5, reportMarkdown: "", reviewSummary: "" },
		]));
		localStorage.setItem("acs_coding_attempts", JSON.stringify([
			{ id: "a1", challengeId: "debounce", createdAt: "2026-05-27", success: true, passedCount: 3, totalCount: 3, duration: 20, cpuTimeMs: 8, error: null },
			{ id: "a2", challengeId: "throttle", createdAt: "2026-05-27", success: true, passedCount: 2, totalCount: 2, duration: 18, cpuTimeMs: 7, error: null },
		]));

		const advice = generateComprehensiveAdvice();
		expect(advice.readiness).toBe("可以投递");
		expect(advice.codingPassRate).toBe(100);
	});

	it("returns '需要继续打磨' with only interview data and no resume", () => {
		clearStorage();
		localStorage.setItem("acs_interview_history", JSON.stringify([
			{ id: "i1", date: "2026-05-27", position: "前端实习生", mode: "auto", averageScore: 60, roundCount: 4, reportMarkdown: "", reviewSummary: "" },
		]));
		const advice = generateComprehensiveAdvice();
		expect(advice.resumeScore).toBeNull();
		expect(advice.interviewAvg).toBe(60);
		expect(advice.readiness).toBe("需要继续打磨");
		expect(advice.nextActions.some((a) => a.category === "resume")).toBe(true);
	});

	it("suggests coding improvement when pass rate is below 50%", () => {
		clearStorage();
		saveResumeVersion({ text: "简历内容", source: "resume-review", scores: { resumeReview: 75 } });
		localStorage.setItem("acs_coding_attempts", JSON.stringify([
			{ id: "a1", challengeId: "debounce", createdAt: "2026-05-27", success: false, passedCount: 1, totalCount: 3, duration: 20, cpuTimeMs: 8, error: "FAIL" },
			{ id: "a2", challengeId: "throttle", createdAt: "2026-05-27", success: false, passedCount: 0, totalCount: 2, duration: 15, cpuTimeMs: 5, error: "FAIL" },
			{ id: "a3", challengeId: "deep-clone", createdAt: "2026-05-27", success: true, passedCount: 4, totalCount: 4, duration: 30, cpuTimeMs: 12, error: null },
		]));
		const advice = generateComprehensiveAdvice();
		expect(advice.codingPassRate).toBe(33);
		expect(advice.nextActions.some((a) => a.action.includes("通过率偏低"))).toBe(true);
		expect(advice.nextActions.some((a) => a.action.includes("最近失败题目"))).toBe(true);
	});

	it("outputs correct readiness with declining interview scores", () => {
		clearStorage();
		saveResumeVersion({ text: "简历内容", source: "resume-review", scores: { resumeReview: 72 } });
		localStorage.setItem("acs_interview_history", JSON.stringify([
			{ id: "i1", date: "2026-05-25", position: "前端实习生", mode: "auto", averageScore: 70, roundCount: 5, reportMarkdown: "", reviewSummary: "" },
			{ id: "i2", date: "2026-05-26", position: "前端实习生", mode: "auto", averageScore: 55, roundCount: 4, reportMarkdown: "", reviewSummary: "" },
			{ id: "i3", date: "2026-05-27", position: "前端实习生", mode: "auto", averageScore: 45, roundCount: 3, reportMarkdown: "", reviewSummary: "" },
		]));
		const advice = generateComprehensiveAdvice();
		expect(advice.interviewAvg).toBeLessThanOrEqual(57);
		expect(advice.readiness).toBe("需要继续打磨");
		expect(advice.nextActions.some((a) => a.action.includes("面试均分偏低"))).toBe(true);
	});
});
