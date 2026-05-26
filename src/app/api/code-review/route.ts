import { NextResponse } from "next/server";
import { requestChatCompletion, parseModelJson } from "@/lib/ai-client";
import { extractAiConfigFromHeaders } from "@/lib/ai-config-header";
import { checkRateLimit } from "@/lib/rate-limit";
import { codeReviewRequestSchema } from "@/lib/validations";

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

	const parsed = codeReviewRequestSchema.safeParse(rawBody);
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
			{ ok: false, error: "未配置 AI API Key。请在设置中填入 API Key。" },
			{ status: 503 },
		);
	}

	try {
		const { content } = await requestChatCompletion([
			{
				role: "system",
				content:
					"你是资深前端面试官，正在审查候选人的手写代码实现。请从正确性、边界处理、时间/空间复杂度、代码风格四个维度评估。必须只输出 JSON，不要 Markdown。JSON 字段：correctness（0-30，正确性）、edgeCases（0-25，边界处理）、complexity（0-25，复杂度分析）、codeStyle（0-20，代码风格）、total（0-100，总分）、comment（一段 2-4 句话的总体点评）、suggestions（字符串数组，2-4 条具体改进建议）。",
			},
			{
				role: "user",
				content: JSON.stringify({
					challenge: body.challengeTitle,
					description: body.challengeDescription,
					code: body.code,
					testsPassed: body.testsPassed,
					testsTotal: body.testsTotal,
					testsPassedCount: body.testsPassedCount,
					rules: [
						"评分必须基于代码实际质量，通过测试不代表代码完美",
						"suggestions 必须是具体的代码改进建议，不要泛泛而谈",
						"如果代码有明显 bug 但恰好通过了测试，correctness 应扣分并在 comment 中说明",
						"complexity 分析应指出时间和空间复杂度",
					],
				}),
			},
		], aiConfig);

		const result = parseModelJson<Record<string, unknown>>(
			content,
			"AI 未返回合法的代码审查 JSON，请重试。",
		);

		const pickNum = (key: string, max: number) => {
			const v = result[key];
			return typeof v === "number" ? Math.min(max, Math.max(0, Math.round(v))) : 0;
		};

		const filterStrings = (val: unknown) =>
			Array.isArray(val) ? val.filter((s): s is string => typeof s === "string" && s.length > 0) : [];

		return NextResponse.json({
			ok: true,
			correctness: pickNum("correctness", 30),
			edgeCases: pickNum("edgeCases", 25),
			complexity: pickNum("complexity", 25),
			codeStyle: pickNum("codeStyle", 20),
			total: pickNum("total", 100),
			comment: typeof result.comment === "string" ? result.comment : "",
			suggestions: filterStrings(result.suggestions),
		});
	} catch (error) {
		return NextResponse.json(
			{
				ok: false,
				error: error instanceof Error ? error.message : "AI 代码审查失败。",
			},
			{ status: 502 },
		);
	}
}
