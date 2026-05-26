import { NextResponse } from "next/server";
import { requestChatCompletion, parseModelJson } from "@/lib/ai-client";
import { extractAiConfigFromHeaders } from "@/lib/ai-config-header";
import { checkRateLimit } from "@/lib/rate-limit";
import { polishProject, type ProjectPolishResult } from "@/lib/analysis";
import { projectPolishRequestSchema } from "@/lib/validations";

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

	const parsed = projectPolishRequestSchema.safeParse(rawBody);
	if (!parsed.success) {
		const firstError = parsed.error.issues[0]?.message || "请求参数校验失败。";
		return NextResponse.json(
			{ ok: false, error: firstError },
			{ status: 400 },
		);
	}

	const project = parsed.data.project.trim();

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
			...polishProject(project),
		});
	}

	try {
		const aiConfig = extractAiConfigFromHeaders(request);
		const { content } = await requestChatCompletion([
			{
				role: "system",
				content:
					"你是资深前端面试官和简历优化专家。请把候选人的原始项目描述优化为大厂前端简历风格的表达。必须只输出 JSON，不要 Markdown。JSON 字段：polished（字符串，优化后的项目描述，2-4 句话，大厂简历风格）、highlights（字符串数组，3-4 条亮点拆解）、followUps（字符串数组，3-4 条面试官可能的追问点）、resumeBullets（字符串数组，2-3 条可直接放入简历的 bullet point）。",
			},
			{
				role: "user",
				content: JSON.stringify({
					project,
					rules: [
						"polished 必须用'问题-方案-结果'结构重写，不能只列技术栈",
						"highlights 必须指出原始描述和优化后描述的关键差异",
						"followUps 必须是面试官基于优化后描述会追问的真实问题",
						"resumeBullets 必须包含动作动词 + 技术细节 + 可量化结果",
						"不要编造原始描述里没有的技术栈或功能",
					],
				}),
			},
		], aiConfig);

		const parsed = parseModelJson<Partial<ProjectPolishResult>>(
			content,
			"AI 未返回合法的项目优化 JSON，请重试。",
		);

		const filterStrings = (arr: unknown) =>
			Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string" && s.length > 0) : [];

		return NextResponse.json({
			ok: true,
			provider: "ai",
			polished: typeof parsed.polished === "string" && parsed.polished.length > 0 ? parsed.polished : "",
			highlights: filterStrings(parsed.highlights),
			followUps: filterStrings(parsed.followUps),
			resumeBullets: filterStrings(parsed.resumeBullets),
		});
	} catch (error) {
		return NextResponse.json(
			{
				ok: false,
				error: error instanceof Error ? error.message : "AI 项目优化失败。",
			},
			{ status: 502 },
		);
	}
}
