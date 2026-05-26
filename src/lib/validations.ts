import { z } from "zod";

const interviewerRoleSchema = z.enum(["gentle", "pressure", "deep-dive"]);

const interviewModeSchema = z.enum(["practice", "auto"]);

const interviewTopicSchema = z.object({
	id: z.string(),
	focus: z.string(),
	dimension: z.string(),
	question: z.string(),
	boundary: z.string(),
	category: z.enum(["resume", "fundamental"]).optional(),
});

const interviewRoundSchema = interviewTopicSchema.extend({
	feedback: z.string(),
	followUp: z.string(),
	trigger: z.string(),
	answerStandard: z.string(),
	shouldSwitchFocus: z.boolean().optional(),
	switchReason: z.string().optional(),
});

export const planRequestSchema = z.object({
	action: z.literal("plan"),
	resumeText: z.string().min(1, "请先上传或粘贴真实简历内容。"),
	position: z.string().optional(),
	interviewerRole: interviewerRoleSchema.optional(),
	focusContext: z.string().optional(),
});

export const roundRequestSchema = z.object({
	action: z.literal("round"),
	resumeText: z.string().min(1, "缺少简历内容。"),
	position: z.string().optional(),
	interviewerRole: interviewerRoleSchema.optional(),
	mode: interviewModeSchema.optional(),
	answer: z.string().optional(),
	currentRound: interviewRoundSchema,
	currentDepth: z.number().int().min(0).optional(),
	coveredFocuses: z.array(z.string()).optional(),
	nextTopic: interviewTopicSchema.optional(),
	history: z.array(z.object({
		focus: z.string(),
		question: z.string(),
		answer: z.string(),
	})).optional(),
});

export const reviewRequestSchema = z.object({
	action: z.literal("review"),
	resumeText: z.string().optional(),
	position: z.string().optional(),
	mode: interviewModeSchema.optional(),
	stream: z.boolean().optional(),
	rounds: z.array(z.object({
		focus: z.string(),
		question: z.string(),
		answer: z.string(),
		dimension: z.string(),
	})).min(1, "没有面试记录可供复盘。"),
	averageScore: z.number().optional(),
});

export const interviewAiRequestSchema = z.discriminatedUnion("action", [
	planRequestSchema,
	roundRequestSchema,
	reviewRequestSchema,
]);

export const resumeReviewRequestSchema = z.object({
	resume: z.string().min(20, "请提供至少 20 字的简历内容。"),
});

export const jdMatchRequestSchema = z.object({
	jd: z.string().min(10, "请提供至少 10 字的岗位 JD。"),
	resume: z.string().min(10, "请提供至少 10 字的简历内容。"),
});

export const projectPolishRequestSchema = z.object({
	project: z.string().min(10, "请提供至少 10 字的项目描述。"),
});

export const codeReviewRequestSchema = z.object({
	code: z.string().min(1, "请提供代码内容。"),
	challengeTitle: z.string().min(1, "缺少题目信息。"),
	challengeDescription: z.string(),
	testsPassed: z.boolean(),
	testsTotal: z.number().int().min(0),
	testsPassedCount: z.number().int().min(0),
});
