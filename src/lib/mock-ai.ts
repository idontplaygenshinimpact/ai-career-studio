/**
 * Deprecated legacy module kept only so historical references do not disappear.
 * The real interview flow must use `src/lib/interview-core.ts` and
 * `POST /api/interview-ai` instead of this file.
 */

export {
	type AnswerScore,
	createOpeningRound,
	frontendFundamentalTopics,
	getInterviewSummary,
	type InterviewRound,
	type InterviewTopic,
	scoreInterviewAnswer,
} from "./interview-core";
