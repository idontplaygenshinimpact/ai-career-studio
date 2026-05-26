/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBoard } from "../ScoreBoard";

describe("ScoreBoard", () => {
	it("renders average score", () => {
		render(
			<ScoreBoard
				averageScore={78}
				isCompleted={false}
				hasRound={true}
				isAiScore={false}
				completedCount={3}
				inquiryDepth={40}
				summary="表现不错"
			/>,
		);
		expect(screen.getByText("78")).toBeTruthy();
	});

	it("shows AI Score label when isAiScore is true", () => {
		render(
			<ScoreBoard
				averageScore={85}
				isCompleted={false}
				hasRound={true}
				isAiScore={true}
				completedCount={5}
				inquiryDepth={60}
				summary="很好"
			/>,
		);
		expect(screen.getByText("AI Score")).toBeTruthy();
	});

	it("shows completed status", () => {
		render(
			<ScoreBoard
				averageScore={90}
				isCompleted={true}
				hasRound={true}
				isAiScore={true}
				completedCount={10}
				inquiryDepth={80}
				summary="优秀"
			/>,
		);
		expect(screen.getByText(/已生成复盘/)).toBeTruthy();
	});

	it("shows guide state when no round", () => {
		render(
			<ScoreBoard
				averageScore={0}
				isCompleted={false}
				hasRound={false}
				isAiScore={false}
				completedCount={0}
				inquiryDepth={18}
				summary="等待开始"
			/>,
		);
		expect(screen.getByText(/上传简历并开始面试/)).toBeTruthy();
	});

	it("renders summary text", () => {
		render(
			<ScoreBoard
				averageScore={70}
				isCompleted={false}
				hasRound={true}
				isAiScore={false}
				completedCount={2}
				inquiryDepth={30}
				summary="建议补全异常处理"
			/>,
		);
		expect(screen.getByText("建议补全异常处理")).toBeTruthy();
	});

	it("displays completed count", () => {
		render(
			<ScoreBoard
				averageScore={60}
				isCompleted={false}
				hasRound={true}
				isAiScore={false}
				completedCount={7}
				inquiryDepth={50}
				summary="继续加油"
			/>,
		);
		expect(screen.getByText(/已追问 7 次/)).toBeTruthy();
	});
});
