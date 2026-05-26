import { NextResponse } from "next/server";
import { requestChatCompletion, parseModelJson } from "@/lib/ai-client";
import { extractAiConfigFromHeaders } from "@/lib/ai-config-header";
import { checkRateLimit } from "@/lib/rate-limit";
import { matchJd, type JdMatchResult } from "@/lib/analysis";
import { jdMatchRequestSchema } from "@/lib/validations";

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

	const parsed = jdMatchRequestSchema.safeParse(rawBody);
	if (!parsed.success) {
		const firstError = parsed.error.issues[0]?.message || "请求参数校验失败。";
		return NextResponse.json(
			{ ok: false, error: firstError },
			{ status: 400 },
		);
	}

	const jd = parsed.data.jd.trim();
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
			...matchJd(jd, resume),
		});
	}

	try {
		const aiConfig = extractAiConfigFromHeaders(request);
		const { content, debug } = await requestChatCompletion([
			{
				role: "system",
				content:
					"你是资深前端面试官和招聘顾问。请分析候选人简历与目标岗位 JD 的匹配程度。必须只输出 JSON，不要 Markdown。JSON 字段：score（0-100 整数，匹配度评分）、matchedKeywords（字符串数组，简历中命中 JD 要求的关键技能/经验）、missingKeywords（字符串数组，JD 要求但简历缺失的关键项）、rewriteAdvice（字符串数组，3-4 条针对这个 JD 的简历改写建议）、interviewDirections（字符串数组，3-4 条基于匹配结果的面试准备方向）。",
			},
			{
				role: "user",
				content: JSON.stringify({
					jd,
					resume,
					rules: [
						"matchedKeywords 必须是 JD 和简历都明确提到的具体技能或经验",
						"missingKeywords 必须是 JD 明确要求但简历中缺失的项",
						"rewriteAdvice 必须针对这个具体 JD 提出改写建议，不要泛泛而谈",
						"interviewDirections 必须基于匹配和缺失结果给出具体的面试准备策略",
						"score 综合考虑技能覆盖率、项目相关性、经验匹配度",
					],
				}),
			},
		], aiConfig);

		const parsed = parseModelJson<Partial<JdMatchResult>>(
			content,
			"AI 未返回合法的 JD 匹配 JSON，请重试。",
		);

		const filterStrings = (arr: unknown) =>
			Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string" && s.length > 0) : [];

		return NextResponse.json({
			ok: true,
			provider: "ai",
			score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 65,
			matchedKeywords: filterStrings(parsed.matchedKeywords),
			missingKeywords: filterStrings(parsed.missingKeywords),
			rewriteAdvice: filterStrings(parsed.rewriteAdvice),
			interviewDirections: filterStrings(parsed.interviewDirections),
			_debug: process.env.NODE_ENV === "development" ? debug : undefined,
		});
	} catch (error) {
		return NextResponse.json(
			{
				ok: false,
				error: error instanceof Error ? error.message : "AI JD 匹配分析失败。",
			},
			{ status: 502 },
		);
	}
}
