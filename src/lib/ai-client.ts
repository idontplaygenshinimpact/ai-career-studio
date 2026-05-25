type ChatCompletionResponse = {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
};

export async function requestChatCompletion(
	messages: Array<{ role: "system" | "user"; content: string }>,
) {
	if (!process.env.AI_API_KEY) {
		throw new Error(
			"未配置 AI_API_KEY，无法调用 AI 服务。请在 .env.local 中配置 AI_API_KEY / AI_BASE_URL / AI_MODEL。",
		);
	}

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
		throw new Error(`AI 请求失败：${response.status} ${detail}`);
	}

	const data = (await response.json()) as ChatCompletionResponse;
	const content = data.choices?.[0]?.message?.content;

	if (!content) {
		throw new Error("AI 返回为空。请检查模型配置。");
	}

	return content;
}

function stripCodeFence(content: string) {
	return content
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/```$/i, "")
		.trim();
}

export function parseModelJson<T>(content: string, errorMessage: string): T {
	try {
		return JSON.parse(stripCodeFence(content)) as T;
	} catch {
		throw new Error(errorMessage);
	}
}
