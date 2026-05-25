/**
 * Legacy hardcoded interview data preserved for reference.
 * The real interview flow now uses `src/lib/interview-core.ts` plus
 * the real AI plan/round endpoints.
 */

export const resumeInterviewContext = "";

export const resumeCoveragePlan: Array<{
	focus: string;
	dimension: string;
	question: string;
	boundary: string;
	probes: string[];
}> = [];

export const interviewPlan: Array<{
	focus: string;
	dimension: string;
	question: string;
	boundary: string;
}> = [];
