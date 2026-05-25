import { NextResponse } from "next/server";
import {
	requestChatCompletion,
	parseModelJson,
} from "@/lib/ai-client";
import {
	createOpeningRound,
	frontendFundamentalTopics,
	type InterviewRound,
	type InterviewTopic,
} from "@/lib/interview-core";

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

type ReviewRequest = {
	resumeText?: string;
	position?: string;
	mode?: "practice" | "auto";
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

		if (body.action === "review") {
			return await handleReview(body as ReviewRequest);
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
				"你是严格、真实的前端面试官。请基于真实简历、当前追问点、候选人上一轮回答、已覆盖内容和面试模式生成下一问，同时对候选人上一轮回答进行分项评分。必须只输出 JSON，不要 Markdown。JSON 字段必须包含 id、focus、dimension、question、boundary、feedback、followUp、trigger、answerStandard、shouldSwitchFocus、switchReason、answerScore。answerScore 是对象，包含 total（0-100）、accuracy（0-30，技术准确性）、structure（0-25，表达结构）、depth（0-25，项目深度）、riskHandling（0-20，异常边界）、reviewMindset（0-15，复盘意识）、comment（一句话点评）。不要使用 Mock 语气，不要说自己是 AI。连贯追问模式下，由你作为面试官主导是否继续深挖或切题，不能依赖候选人手动结束追问。",
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
	]);

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

async function handleReview(body: ReviewRequest) {
	if (!body.rounds || body.rounds.length === 0) {
		return NextResponse.json(
			{ ok: false, error: "没有面试记录可供复盘。" },
			{ status: 400 },
		);
	}

	const content = await requestChatCompletion([
		{
			role: "system",
			content:
				"你是资深前端面试官。请基于候选人的完整面试追问轨迹和回答，生成个性化的面试复盘报告。必须只输出 JSON，不要 Markdown。JSON 字段：overallComment（一段 2-4 句话的总体评价）、strengths（字符串数组，2-4 条具体优势，引用实际回答内容）、weaknesses（字符串数组，2-4 条具体短板，指出哪些回答不够好）、nextSteps（字符串数组，3-5 条可执行的改进建议）、interviewReadiness（字符串，'可投递'|'需打磨'|'建议继续练习'）。",
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
	]);

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
