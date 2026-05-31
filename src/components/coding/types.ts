import type { SandboxResult } from "@/lib/sandbox";

export type CodeReviewResult = {
	correctness: number;
	edgeCases: number;
	complexity: number;
	codeStyle: number;
	total: number;
	comment: string;
	suggestions: string[];
};

export type CodingSnapshot = {
	id: string;
	challengeId: string;
	createdAt: string;
	code: string;
};

export type CodingAttempt = {
	id: string;
	challengeId: string;
	createdAt: string;
	success: boolean;
	passedCount: number;
	totalCount: number;
	duration: number;
	cpuTimeMs: number;
	error: string | null;
};

export type SandboxResultLike = SandboxResult;

export const difficultyLabels = ["", "★", "★★", "★★★"];
export const frequencyLabels = ["", "🔥", "🔥🔥", "🔥🔥🔥"];

export function formatTime(value: string) {
	return new Date(value).toLocaleString("zh-CN", {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}
