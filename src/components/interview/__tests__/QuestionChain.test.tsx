/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionChain } from "../QuestionChain";
import { createOpeningRound, frontendFundamentalTopics } from "@/lib/interview-core";

describe("QuestionChain", () => {
	it("shows empty message when no rounds", () => {
		render(
			<QuestionChain
				visibleRounds={[]}
				activeQuestion={0}
				completedCount={0}
			/>,
		);
		expect(screen.getByText(/尚未生成追问链/)).toBeTruthy();
	});

	it("renders rounds with focus labels", () => {
		const r1 = createOpeningRound(frontendFundamentalTopics[0]);
		const r2 = createOpeningRound(frontendFundamentalTopics[1]);
		render(
			<QuestionChain
				visibleRounds={[r1, r2]}
				activeQuestion={1}
				completedCount={1}
			/>,
		);
		expect(screen.getByText(/追问 1/)).toBeTruthy();
		expect(screen.getByText(/追问 2/)).toBeTruthy();
	});

	it("marks active round as 进行中", () => {
		const r1 = createOpeningRound(frontendFundamentalTopics[0]);
		render(
			<QuestionChain
				visibleRounds={[r1]}
				activeQuestion={0}
				completedCount={0}
			/>,
		);
		expect(screen.getByText("进行中")).toBeTruthy();
	});

	it("marks completed round as 已记录", () => {
		const r1 = createOpeningRound(frontendFundamentalTopics[0]);
		const r2 = createOpeningRound(frontendFundamentalTopics[1]);
		render(
			<QuestionChain
				visibleRounds={[r1, r2]}
				activeQuestion={1}
				completedCount={1}
			/>,
		);
		expect(screen.getByText("已记录")).toBeTruthy();
	});
});
