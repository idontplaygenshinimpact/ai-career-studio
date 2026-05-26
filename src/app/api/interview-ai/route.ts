import { NextResponse } from "next/server";
import {
	requestChatCompletion,
	requestChatStream,
	parseModelJson,
	type AiConfig,
} from "@/lib/ai-client";
import { extractAiConfigFromHeaders } from "@/lib/ai-config-header";
import { checkRateLimit } from "@/lib/rate-limit";
import {
	createOpeningRound,
	frontendFundamentalTopics,
	type InterviewRound,
	type InterviewTopic,
} from "@/lib/interview-core";
import {
	interviewerProfiles,
} from "@/data/interviewer-roles";
import {
	interviewAiRequestSchema,
	type planRequestSchema,
	type roundRequestSchema,
	type reviewRequestSchema,
} from "@/lib/validations";
import { codingChallenges } from "@/data/coding-challenges";
import type { z } from "zod";

const codingChallengeList = codingChallenges
	.map((c) => `[${c.category}] ${c.title}`)
	.join("、");

type PlanRequest = z.infer<typeof planRequestSchema>;
type RoundRequest = z.infer<typeof roundRequestSchema>;
type ReviewRequest = z.infer<typeof reviewRequestSchema>;

export async function POST(request: Request) {
	let rawBody: unknown;

	try {
		rawBody = await request.json();
	} catch {
		return NextResponse.json(
			{ ok: false, error: "请求体不是合法 JSON。" },
			{ status: 400 },
		);
	}

	const parsed = interviewAiRequestSchema.safeParse(rawBody);
	if (!parsed.success) {
		const firstError = parsed.error.issues[0]?.message || "请求参数校验失败。";
		return NextResponse.json(
			{ ok: false, error: firstError },
			{ status: 400 },
		);
	}

	const body = parsed.data;
	const aiConfig = extractAiConfigFromHeaders(request);

	const rateCheck = checkRateLimit(request);
	if (!rateCheck.allowed) {
		return NextResponse.json(
			{ ok: false, error: `请求过于频繁，请 ${Math.ceil(rateCheck.retryAfterMs / 1000)} 秒后重试。` },
			{ status: 429 },
		);
	}

	if (!aiConfig?.apiKey && !process.env.AI_API_KEY) {
		return NextResponse.json(
			{
				ok: false,
				error:
					"未配置 AI API Key。请在页面右上角「设置」中填入你的 API Key，或在服务端 .env.local 中配置。",
			},
			{ status: 503 },
		);
	}

	try {
		if (body.action === "plan") {
			return await handlePlan(body, aiConfig);
		}

		if (body.action === "round") {
			return await handleRound(body, aiConfig);
		}

		if (body.action === "review") {
			return await handleReview(body, aiConfig);
		}
	} catch (error) {
		return NextResponse.json(
			{
				ok: false,
				error:
					error instanceof Error
						? error.message
						: "真实 AI 面试接口异常，请稍后重试。",
			},
			{ status: 502 },
		);
	}

	return NextResponse.json(
		{ ok: false, error: "未知 interview-ai action。" },
		{ status: 400 },
	);
}

async function handlePlan(body: PlanRequest, aiConfig?: AiConfig) {
	const resumeText = body.resumeText.trim();
	const profile = interviewerProfiles[body.interviewerRole || "gentle"];
	const position = body.position || "前端实习生";

	const { content } = await requestChatCompletion([
		{
			role: "system",
			content:
				`${profile.systemPromptPrefix}\n\n请解析候选人的真实简历，为"${position}"一面生成面试追问计划。必须只输出 JSON，不要 Markdown。JSON 字段：summary、resumeTopics、fundamentalTopics。resumeTopics 是从简历中抽取的项目/实习/经历追问点数组；fundamentalTopics 是针对"${position}"岗位的 8-12 道高频基础知识题数组。两个数组的每项都包含 id、focus、dimension、question、boundary。resumeTopics 不允许编造简历没有的项目。fundamentalTopics 必须覆盖该岗位最核心的基础知识领域。`,
		},
		{
			role: "user",
			content: JSON.stringify({
				position,
				resumeText,
				focusContext: body.focusContext || undefined,
				requiredOutputRules: [
					"resumeTopics 至少包含 3 个来自简历真实项目/实习/经历的追问点，除非简历本身信息不足",
					"resumeTopics 里每个 boundary 必须说明本追问点不能越界到哪里",
					"question 必须像真实面试官第一问，而不是简历复述",
					"不要使用硬编码候选人姓名或预设项目，只能基于 resumeText",
					`fundamentalTopics 必须针对"${position}"岗位，覆盖该岗位最高频的基础知识领域`,
					"fundamentalTopics 的 question 必须像真实面试穿插提问，不要出成考试题",
					"fundamentalTopics 每项的 id 必须以 fundamental- 开头",
					`fundamentalTopics 中应包含 2-3 道手写/算法题，从以下题库中选择：${codingChallengeList}。手写题的 question 应要求候选人说明实现思路和关键步骤`,
					body.focusContext ? `用户特别要求重点追问以下方向，请在 resumeTopics 和 fundamentalTopics 中优先覆盖：${body.focusContext}` : "",
				].filter(Boolean),
			}),
		},
	], aiConfig);

	const parsed = parseModelJson<{ summary?: unknown; resumeTopics?: unknown; fundamentalTopics?: unknown; topics?: unknown }>(
		content,
		"真实 AI 没有返回合法的面试计划 JSON，请重试。",
	);
	const resumeTopics = normalizeTopics(parsed.resumeTopics || parsed.topics);
	const aiFundamentals = normalizeTopics(parsed.fundamentalTopics).map((t) => ({
		...t,
		category: "fundamental" as const,
		id: t.id.startsWith("fundamental-") ? t.id : `fundamental-${t.id}`,
	}));
	const fundamentals = aiFundamentals.length >= 5 ? aiFundamentals : frontendFundamentalTopics;
	const topics = mergeTopics(resumeTopics, fundamentals);
	const openingRound = createOpeningRound(topics[0]);

	return NextResponse.json({
		ok: true,
		provider: "real",
		summary:
			typeof parsed.summary === "string"
				? parsed.summary
				: "已基于真实简历生成面试追问计划。",
		topics,
		openingRound,
	});
}

async function handleRound(body: RoundRequest, aiConfig?: AiConfig) {
	const profile = interviewerProfiles[body.interviewerRole || "gentle"];

	const { content } = await requestChatCompletion([
		{
			role: "system",
			content:
				`${profile.systemPromptPrefix}\n\n请基于真实简历、当前追问点、候选人上一轮回答、已覆盖内容和面试模式生成下一问，同时对候选人上一轮回答进行分项评分。必须只输出 JSON，不要 Markdown。JSON 字段必须包含 id、focus、dimension、question、boundary、feedback、followUp、trigger、answerStandard、shouldSwitchFocus、switchReason、answerScore。answerScore 是对象，包含 total（0-100）、accuracy（0-30，技术准确性）、structure（0-25，表达结构）、depth（0-25，项目深度）、riskHandling（0-20，异常边界）、reviewMindset（0-15，复盘意识）、comment（一句话点评）。不要使用 Mock 语气，不要说自己是 AI。连贯追问模式下，由你作为面试官主导是否继续深挖或切题，不能依赖候选人手动结束追问。`,
		},
		{
			role: "user",
			content: JSON.stringify({
				position: body.position || "前端实习生",
				mode: body.mode || "auto",
				resumeText: body.resumeText,
				candidateAnswer: body.answer,
				currentRound: body.currentRound,
				currentDepth: body.currentDepth ?? 0,
				coveredFocuses: body.coveredFocuses ?? [],
				nextTopicIfDone: body.nextTopic,
				history: body.history ?? [],
					rules: [
					"trigger 必须说明追问依据来自回答或简历的哪个具体点",
					"answerStandard 必须说明合格回答的 3-5 个关键点",
					"真实一面节奏分三个阶段：(1)先集中拷打实习/项目经历，每个话题方向深挖 2-3 轮，拷打完一个方向再换下一个方向；(2)项目拷打结束后集中问 4-5 轮基础八股（HTTP、事件循环、原型链、CSS、闭包等）；(3)穿插 1-2 道手写题思路（如防抖实现、Promise.all 怎么写）再继续八股",
					"同一个 focus 方向内的追问都算同一'问'的深挖，切换到新 focus 才算新的一'问'",
					"面试官可以从简历中自行挑选最有价值的技术点追问，围绕候选人回答中暴露的薄弱点继续深挖",
					`手写题和算法题必须从以下题库中选择，不要自行编造题目。可用题库：${codingChallengeList}。出手写/算法题时，question 中说明题目名称和核心要求即可，候选人可以在手写练习页完成实际编码`,
					"currentDepth>=2 时除非回答明显空泛，否则必须 shouldSwitchFocus=true 切换到 nextTopicIfDone",
					"shouldSwitchFocus=true 时，focus/question/dimension/boundary 必须切换到 nextTopicIfDone",
					"连贯追问模式必须像真实面试官控制节奏，不能让候选人主导方向",
					"answerScore.total 必须等于 accuracy+structure+depth+riskHandling+reviewMindset 之和（允许±2 误差），不要随意给高分",
					"answerScore.comment 用一句话指出回答的核心优缺点",
				],
			}),
		},
	], aiConfig);

	const parsed = parseModelJson<Partial<InterviewRound> & { answerScore?: unknown }>(
		content,
		"真实 AI 没有返回合法的追问 JSON，请重试。",
	);
	const round = normalizeRound(parsed, body.currentRound, body.nextTopic);
	const answerScore = normalizeAnswerScore(parsed.answerScore);

	return NextResponse.json({
		ok: true,
		provider: "real",
		round,
		answerScore,
		shouldSwitchFocus: Boolean(round.shouldSwitchFocus),
		switchReason: round.switchReason,
	});
}

async function handleReview(body: ReviewRequest, aiConfig?: AiConfig) {
	const messages: Array<{ role: "system" | "user"; content: string }> = [
		{
			role: "system",
			content: body.stream
				? "你是资深前端面试官。请基于候选人的完整面试追问轨迹和回答，用自然语言生成个性化的面试复盘报告。格式：先写一段总体评价，然后分「强项」「短板」「下一步」「推荐学习方向」四个小节。强项和短板各 2-4 条，必须引用具体的追问和回答。下一步 3-5 条可立即执行的行动。推荐学习方向 2-4 条，针对本次面试暴露的薄弱知识点，给出具体的学习主题和建议学习顺序（例如：先理解 XX 概念，再练习 YY 场景）。最后给出面试可投递性判断（可投递/需打磨/建议继续练习）。直接输出纯文本，不要输出 JSON 或 Markdown 代码块。"
				: "你是资深前端面试官。请基于候选人的完整面试追问轨迹和回答，生成个性化的面试复盘报告。必须只输出 JSON，不要 Markdown。JSON 字段：overallComment（一段 2-4 句话的总体评价）、strengths（字符串数组，2-4 条具体优势，引用实际回答内容）、weaknesses（字符串数组，2-4 条具体短板，指出哪些回答不够好）、nextSteps（字符串数组，3-5 条可执行的改进建议）、learningPaths（字符串数组，2-4 条推荐学习方向，针对薄弱知识点给出具体学习主题和建议顺序）、interviewReadiness（字符串，'可投递'|'需打磨'|'建议继续练习'）。",
		},
		{
			role: "user",
			content: JSON.stringify({
				position: body.position || "前端实习生",
				mode: body.mode || "auto",
				averageScore: body.averageScore ?? 0,
				resumeText: body.resumeText?.slice(0, 500),
				rounds: body.rounds,
				rules: [
					"strengths 和 weaknesses 必须引用具体的追问和回答内容",
					"nextSteps 必须是候选人可以立即执行的具体动作",
					"不要泛泛而谈，要针对这次面试的实际表现",
				],
			}),
		},
	];

	if (body.stream) {
		const stream = await requestChatStream(messages, aiConfig);
		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Transfer-Encoding": "chunked",
				"Cache-Control": "no-cache",
			},
		});
	}

	const { content } = await requestChatCompletion(messages, aiConfig);

	const parsed = parseModelJson<Record<string, unknown>>(
		content,
		"AI 未返回合法的复盘 JSON，请重试。",
	);

	const filterStrings = (val: unknown) =>
		Array.isArray(val) ? val.filter((s): s is string => typeof s === "string" && s.length > 0) : [];

	return NextResponse.json({
		ok: true,
		provider: "real",
		overallComment: typeof parsed.overallComment === "string" ? parsed.overallComment : "",
		strengths: filterStrings(parsed.strengths),
		weaknesses: filterStrings(parsed.weaknesses),
		nextSteps: filterStrings(parsed.nextSteps),
		learningPaths: filterStrings(parsed.learningPaths),
		interviewReadiness: typeof parsed.interviewReadiness === "string" ? parsed.interviewReadiness : "需打磨",
	});
}

function mergeTopics(resumeTopics: InterviewTopic[], fundamentalTopics: InterviewTopic[]) {
	const normalizedResumeTopics = resumeTopics.map((topic) => ({
		...topic,
		category: "resume" as const,
	}));
	const topics = interleaveTopics(
		normalizedResumeTopics,
		fundamentalTopics,
	);
	const seen = new Set<string>();

	return topics.filter((topic) => {
		if (seen.has(topic.focus)) {
			return false;
		}

		seen.add(topic.focus);
		return true;
	});
}

function interleaveTopics(
	resumeTopics: InterviewTopic[],
	fundamentalTopics: InterviewTopic[],
) {
	const topics: InterviewTopic[] = [];
	const maxLength = Math.max(resumeTopics.length, fundamentalTopics.length);

	for (let index = 0; index < maxLength; index += 1) {
		if (resumeTopics[index]) {
			topics.push(resumeTopics[index]);
		}

		if (index === 0 && resumeTopics[1]) {
			topics.push(resumeTopics[1]);
		}

		if (fundamentalTopics[index]) {
			topics.push(fundamentalTopics[index]);
		}

		if (index !== 0 && resumeTopics[index + 1]) {
			topics.push(resumeTopics[index + 1]);
		}
	}

	return topics;
}

function normalizeTopics(value: unknown): InterviewTopic[] {
	if (!Array.isArray(value)) {
		throw new Error("真实 AI 未返回有效 topics。 ");
	}

	const topics: InterviewTopic[] = [];

	value.forEach((item, index) => {
		const record = item as Record<string, unknown>;
		const focus = pickText(record.focus, "");
		const dimension = pickText(record.dimension, "");
		const question = pickText(record.question, "");
		const boundary = pickText(record.boundary, "");

		if (!focus || !dimension || !question || !boundary) {
			return;
		}

		topics.push({
			id: slugify(pickText(record.id, `resume-topic-${index + 1}`)),
			category: "resume",
			focus,
			dimension,
			question,
			boundary,
		});
	});

	return topics;
}

function normalizeRound(
	parsed: Partial<InterviewRound>,
	fallbackRound: InterviewRound,
	nextTopic?: InterviewTopic,
): InterviewRound {
	const shouldSwitchFocus = Boolean(parsed.shouldSwitchFocus);
	const base =
		shouldSwitchFocus && nextTopic
			? createOpeningRound(nextTopic)
			: fallbackRound;

	return {
		id: slugify(pickText(parsed.id, `${base.id}-${Date.now()}`)),
		focus: pickText(parsed.focus, base.focus),
		dimension: pickText(parsed.dimension, base.dimension),
		question: pickText(parsed.question, base.question),
		boundary: pickText(parsed.boundary, base.boundary),
		feedback: pickText(parsed.feedback, base.feedback),
		followUp: pickText(parsed.followUp, base.followUp),
		trigger: pickText(parsed.trigger, base.trigger),
		answerStandard: pickText(parsed.answerStandard, base.answerStandard),
		shouldSwitchFocus,
		switchReason:
			typeof parsed.switchReason === "string" ? parsed.switchReason : undefined,
	};
}

function pickText(value: unknown, fallback: string) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: fallback;
}

function slugify(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normalizeAnswerScore(value: unknown) {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const pickNum = (key: string, max: number) => {
		const v = record[key];
		return typeof v === "number" ? Math.min(max, Math.max(0, Math.round(v))) : 0;
	};

	const accuracy = pickNum("accuracy", 30);
	const structure = pickNum("structure", 25);
	const depth = pickNum("depth", 25);
	const riskHandling = pickNum("riskHandling", 20);
	const reviewMindset = pickNum("reviewMindset", 15);
	const total = pickNum("total", 100) || (accuracy + structure + depth + riskHandling + reviewMindset);
	const comment = typeof record.comment === "string" ? record.comment : "";

	return { total, accuracy, structure, depth, riskHandling, reviewMindset, comment };
}
