import { NextResponse } from "next/server";
import { requestChatCompletion, parseModelJson } from "@/lib/ai-client";
import { extractAiConfigFromHeaders } from "@/lib/ai-config-header";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildReview, type ReviewResult } from "@/lib/analysis";
import { resumeReviewRequestSchema } from "@/lib/validations";

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

	const parsed = resumeReviewRequestSchema.safeParse(rawBody);
	if (!parsed.success) {
		const firstError = parsed.error.issues[0]?.message || "请求参数校验失败。";
		return NextResponse.json(
			{ ok: false, error: firstError },
			{ status: 400 },
		);
	}

	const resume = parsed.data.resume.trim();

	const rateCheck = checkRateLimit(request);
	if (!rateCheck.allowed) {
		return NextResponse.json(
			{ ok: false, error: `请求过于频繁，请 ${Math.ceil(rateCheck.retryAfterMs / 1000)} 秒后重试。` },
			{ status: 429 },
		);
	}

	if (!process.env.AI_API_KEY && !request.headers.get("x-ai-api-key")) {
		return NextResponse.json({
			ok: true,
			provider: "local",
			...buildReview(resume),
		});
	}

	try {
		const aiConfig = extractAiConfigFromHeaders(request);
		const { content, debug } = await requestChatCompletion([
			{
				role: "system",
				content:
					"你是资深前端面试官和简历顾问。请诊断候选人的简历，输出结构化评估。必须只输出 JSON，不要 Markdown。JSON 字段：score（0-100 整数）、strengths（字符串数组，3-5 条具体优势）、risks（字符串数组，3-5 条具体风险）、suggestions（字符串数组，3-5 条可执行的优化建议）。评分标准：项目完整度、技术深度、量化成果、表达清晰度。必须基于简历实际内容分析，不要泛泛而谈。",
			},
			{
				role: "user",
				content: JSON.stringify({
					resume,
					rules: [
						"strengths 必须引用简历中的具体内容，不要说空话",
						"risks 必须指出简历中的具体缺陷或缺失项",
						"suggestions 必须是候选人可以立即执行的具体动作",
						"score 基于前端实习/校招标准评估",
					],
				}),
			},
		], aiConfig);

		const parsed = parseModelJson<Partial<ReviewResult>>(
			content,
			"AI 未返回合法的简历诊断 JSON，请重试。",
		);

		return NextResponse.json({
			ok: true,
			provider: "ai",
			score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 70,
			strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s): s is string => typeof s === "string" && s.length > 0) : [],
			risks: Array.isArray(parsed.risks) ? parsed.risks.filter((s): s is string => typeof s === "string" && s.length > 0) : [],
			suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((s): s is string => typeof s === "string" && s.length > 0) : [],
			_debug: process.env.NODE_ENV === "development" ? debug : undefined,
		});
	} catch (error) {
		return NextResponse.json(
			{
				ok: false,
				error: error instanceof Error ? error.message : "AI 简历诊断失败。",
			},
			{ status: 502 },
		);
	}
}
