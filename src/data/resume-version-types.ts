export type ResumeVersionSource =
	| "manual"
	| "jd-match"
	| "resume-review"
	| "project-polish"
	| "mock-interview";

export type ResumeVersionScores = {
	resumeReview?: number;
	jdMatch?: number;
	interviewAvg?: number;
};

export type ResumeSuggestion = {
	source: ResumeVersionSource;
	content: string;
	priority: "high" | "medium" | "low";
};

export type ResumeVersion = {
	id: string;
	lineId: string;
	createdAt: string;
	text: string;
	source: ResumeVersionSource;
	model?: string;
	scores: ResumeVersionScores;
	suggestions: ResumeSuggestion[];
};

export type ResumeLine = {
	id: string;
	label: string;
	fingerprint: string;
	createdAt: string;
};
