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
	type InterviewerRole,
} from "@/data/interviewer-roles";

type PlanRequest = {
	resumeText?: string;
	position?: string;
	interviewerRole?: InterviewerRole;
};

type RoundRequest = {
	resumeText?: string;
	position?: string;
	interviewerRole?: InterviewerRole;
	mode?: "practice" | "auto";
	answer?: string;
	currentRound?: InterviewRound;
	currentDepth?: number;
	coveredFocuses?: string[];
	nextTopic?: InterviewTopic;
	history?: Array<{
		focus: string;
		question: string;
		answer: string;
	}>;
};

type ReviewRequest = {
	resumeText?: string;
	position?: string;
	mode?: "practice" | "auto";
	stream?: boolean;
	rounds?: Array<{
		focus: string;
		question: string;
		answer: string;
		dimension: string;
	}>;
	averageScore?: number;
};

export async function POST(request: Request) {
	let body: { action?: string } & (PlanRequest | RoundRequest | ReviewRequest);

	try {
		body = (await request.json()) as { action?: string } & (
			| PlanRequest
			| RoundRequest
			| ReviewRequest
		);
	} catch {
		return NextResponse.json(
			{ ok: false, error: "请求体不是合法 JSON。" },
			{ status: 400 },
		);
	}

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
			return await handlePlan(body as PlanRequest, aiConfig);
		}

		if (body.action === "round") {
			return await handleRound(body as RoundRequest, aiConfig);
		}

		if (body.action === "review") {
			return await handleReview(body as ReviewRequest, aiConfig);
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
	const resumeText = body.resumeText?.trim();
	const profile = interviewerProfiles[body.interviewerRole || "gentle"];

	if (!resumeText) {
		return NextResponse.json(
			{ ok: false, error: "请先上传或粘贴真实简历内容。" },
			{ status: 400 },
		);
	}

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
				requiredOutputRules: [
					"resumeTopics 至少包含 3 个来自简历真实项目/实习/经历的追问点，除非简历本身信息不足",
					"resumeTopics 里每个 boundary 必须说明本追问点不能越界到哪里",
					"question 必须像真实面试官第一问，而不是简历复述",
					"不要使用硬编码候选人姓名或预设项目，只能基于 resumeText",
					`fundamentalTopics 必须针对"${position}"岗位，覆盖该岗位最高频的基础知识领域`,
					"fundamentalTopics 的 question 必须像真实面试穿插提问，不要出成考试题",
					"fundamentalTopics 每项的 id 必须以 fundamental- 开头",
				],
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
	if (!body.resumeText?.trim() || !body.currentRound) {
		return NextResponse.json(
			{ ok: false, error: "缺少简历内容或当前追问轮次。" },
			{ status: 400 },
		);
	}

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
					"基础八股和计算机基础必须像真实一面一样穿插；如果 nextTopicIfDone 是基础题且当前项目点已经追问充分，应主动切换",
					"连贯追问模式下，不要无限深挖同一个 focus。currentDepth=0 可以继续追问；currentDepth=1 时如果回答已覆盖关键实现、异常边界或验证方式，应切换；currentDepth>=2 时除非回答明显空泛，否则必须切换到 nextTopicIfDone",
					"切换逻辑边界：回答已达到 answerStandard、继续追问会重复、继续追问会越过 boundary、或需要按一面节奏穿插基础题时，都应 shouldSwitchFocus=true",
					"shouldSwitchFocus=true 时，focus/question/dimension/boundary 必须切换到 nextTopicIfDone",
					"练习模式可以更耐心地围绕当前点追问；连贯追问模式必须更像真实面试官控制节奏",
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
	if (!body.rounds || body.rounds.length === 0) {
		return NextResponse.json(
			{ ok: false, error: "没有面试记录可供复盘。" },
			{ status: 400 },
		);
	}

	const messages: Array<{ role: "system" | "user"; content: string }> = [
		{
			role: "system",
			content: body.stream
				? "你是资深前端面试官。请基于候选人的完整面试追问轨迹和回答，用自然语言生成个性化的面试复盘报告。格式：先写一段总体评价，然后分「强项」「短板」「下一步」三个小节，每节 2-4 条，最后给出面试可投递性判断（可投递/需打磨/建议继续练习）。直接输出纯文本，不要输出 JSON 或 Markdown 代码块。"
				: "你是资深前端面试官。请基于候选人的完整面试追问轨迹和回答，生成个性化的面试复盘报告。必须只输出 JSON，不要 Markdown。JSON 字段：overallComment（一段 2-4 句话的总体评价）、strengths（字符串数组，2-4 条具体优势，引用实际回答内容）、weaknesses（字符串数组，2-4 条具体短板，指出哪些回答不够好）、nextSteps（字符串数组，3-5 条可执行的改进建议）、interviewReadiness（字符串，'可投递'|'需打磨'|'建议继续练习'）。",
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
