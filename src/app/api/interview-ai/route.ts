import { NextResponse } from "next/server";
import {
	createOpeningRound,
	frontendFundamentalTopics,
	type InterviewRound,
	type InterviewTopic,
} from "@/lib/interview-core";

type ChatCompletionResponse = {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
};

type PlanRequest = {
	resumeText?: string;
	position?: string;
};

type RoundRequest = {
	resumeText?: string;
	position?: string;
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

export async function POST(request: Request) {
	let body: { action?: string } & (PlanRequest | RoundRequest);

	try {
		body = (await request.json()) as { action?: string } & (
			| PlanRequest
			| RoundRequest
		);
	} catch {
		return NextResponse.json(
			{ ok: false, error: "请求体不是合法 JSON。" },
			{ status: 400 },
		);
	}

	if (!process.env.AI_API_KEY) {
		return NextResponse.json(
			{
				ok: false,
				error:
					"当前是严格真实面试模式：未配置 AI_API_KEY，不能使用 Mock 兜底。请配置 AI_API_KEY / AI_BASE_URL / AI_MODEL 后再开始。",
			},
			{ status: 503 },
		);
	}

	try {
		if (body.action === "plan") {
			return await handlePlan(body as PlanRequest);
		}

		if (body.action === "round") {
			return await handleRound(body as RoundRequest);
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

async function handlePlan(body: PlanRequest) {
	const resumeText = body.resumeText?.trim();

	if (!resumeText) {
		return NextResponse.json(
			{ ok: false, error: "请先上传或粘贴真实简历内容。" },
			{ status: 400 },
		);
	}

	const content = await requestChatCompletion([
		{
			role: "system",
			content:
				"你是资深前端面试官。请解析候选人的真实简历，为前端实习/校招一面生成面试追问计划。必须只输出 JSON，不要 Markdown。JSON 字段：summary、topics。topics 是数组，每项包含 id、focus、dimension、question、boundary。必须从简历真实内容抽取项目/实习/经历追问点，不允许编造简历没有的项目；同时说明这些追问点的逻辑边界。计算机基础和前端八股由系统预置并穿插，不需要你重复生成基础题。",
		},
		{
			role: "user",
			content: JSON.stringify({
				position: body.position || "前端实习生",
				resumeText,
				requiredOutputRules: [
					"topics 至少包含 3 个来自简历真实项目/实习/经历的追问点，除非简历本身信息不足",
					"topics 里每个 boundary 必须说明本追问点不能越界到哪里",
					"question 必须像真实面试官第一问，而不是简历复述",
					"不要使用硬编码候选人姓名或预设项目，只能基于 resumeText",
				],
			}),
		},
	]);

	const parsed = parseModelJson<{ summary?: unknown; topics?: unknown }>(
		content,
		"真实 AI 没有返回合法的面试计划 JSON，请重试。",
	);
	const resumeTopics = normalizeTopics(parsed.topics);
	const topics = mergeTopics(resumeTopics);
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

async function handleRound(body: RoundRequest) {
	if (!body.resumeText?.trim() || !body.currentRound) {
		return NextResponse.json(
			{ ok: false, error: "缺少简历内容或当前追问轮次。" },
			{ status: 400 },
		);
	}

	const content = await requestChatCompletion([
		{
			role: "system",
			content:
				"你是严格、真实的前端面试官。请基于真实简历、当前追问点、候选人上一轮回答、已覆盖内容和面试模式生成下一问。必须只输出 JSON，不要 Markdown。JSON 字段必须包含 id、focus、dimension、question、boundary、feedback、followUp、trigger、answerStandard、shouldSwitchFocus、switchReason。不要使用 Mock 语气，不要说自己是 AI。连贯追问模式下，由你作为面试官主导是否继续深挖或切题，不能依赖候选人手动结束追问。",
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
				],
			}),
		},
	]);

	const parsed = parseModelJson<Partial<InterviewRound>>(
		content,
		"真实 AI 没有返回合法的追问 JSON，请重试。",
	);
	const round = normalizeRound(parsed, body.currentRound, body.nextTopic);

	return NextResponse.json({
		ok: true,
		provider: "real",
		round,
		shouldSwitchFocus: Boolean(round.shouldSwitchFocus),
		switchReason: round.switchReason,
	});
}

async function requestChatCompletion(
	messages: Array<{ role: "system" | "user"; content: string }>,
) {
	const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
	const model = process.env.AI_MODEL || "gpt-4o-mini";
	const response = await fetch(
		`${baseUrl.replace(/\/$/, "")}/chat/completions`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.AI_API_KEY}`,
			},
			body: JSON.stringify({
				model,
				temperature: 0.35,
				messages,
			}),
		},
	);

	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		throw new Error(`真实 AI 请求失败：${response.status} ${detail}`);
	}

	const data = (await response.json()) as ChatCompletionResponse;
	const content = data.choices?.[0]?.message?.content;

	if (!content) {
		throw new Error("真实 AI 返回为空。请检查模型配置。 ");
	}

	return content;
}

function mergeTopics(resumeTopics: InterviewTopic[]) {
	const normalizedResumeTopics = resumeTopics.map((topic) => ({
		...topic,
		category: "resume" as const,
	}));
	const topics = interleaveTopics(
		normalizedResumeTopics,
		frontendFundamentalTopics,
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

function stripCodeFence(content: string) {
	return content
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/```$/i, "")
		.trim();
}

function parseModelJson<T>(content: string, errorMessage: string): T {
	try {
		return JSON.parse(stripCodeFence(content)) as T;
	} catch {
		throw new Error(errorMessage);
	}
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
