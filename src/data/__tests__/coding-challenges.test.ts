import { describe, it, expect } from "vitest";
import { codingChallenges } from "../coding-challenges";

describe("codingChallenges data integrity", () => {
	it("has at least 80 challenges", () => {
		expect(codingChallenges.length).toBeGreaterThanOrEqual(80);
	});

	it("all challenges have unique ids", () => {
		const ids = codingChallenges.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("all challenges have required fields", () => {
		for (const c of codingChallenges) {
			expect(c.id).toBeTruthy();
			expect(c.title).toBeTruthy();
			expect(["handwrite", "algorithm"]).toContain(c.category);
			expect([1, 2, 3]).toContain(c.difficulty);
			expect([1, 2, 3]).toContain(c.frequency);
			expect(c.timeLimit).toBeGreaterThan(0);
			expect(c.description.length).toBeGreaterThan(5);
			expect(c.skeleton.length).toBeGreaterThan(5);
			expect(c.testCode.length).toBeGreaterThan(10);
		}
	});

	it("all test codes contain __test__ function", () => {
		for (const c of codingChallenges) {
			expect(c.testCode).toContain("__test__");
		}
	});

	it("all test codes contain __assert__", () => {
		for (const c of codingChallenges) {
			expect(c.testCode).toContain("__assert__");
		}
	});

	it("has both handwrite and algorithm categories", () => {
		const handwrite = codingChallenges.filter((c) => c.category === "handwrite");
		const algorithm = codingChallenges.filter((c) => c.category === "algorithm");
		expect(handwrite.length).toBeGreaterThanOrEqual(30);
		expect(algorithm.length).toBeGreaterThanOrEqual(30);
	});

	it("all difficulties are represented", () => {
		const d1 = codingChallenges.filter((c) => c.difficulty === 1);
		const d2 = codingChallenges.filter((c) => c.difficulty === 2);
		const d3 = codingChallenges.filter((c) => c.difficulty === 3);
		expect(d1.length).toBeGreaterThan(0);
		expect(d2.length).toBeGreaterThan(0);
		expect(d3.length).toBeGreaterThan(0);
	});
});
