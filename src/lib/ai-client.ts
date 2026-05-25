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

export async function requestChatStream(
	messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<ReadableStream<Uint8Array>> {
	if (!process.env.AI_API_KEY) {
		throw new Error("未配置 AI_API_KEY，无法调用 AI 服务。");
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
				stream: true,
				messages,
			}),
		},
	);

	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		throw new Error(`AI 请求失败：${response.status} ${detail}`);
	}

	if (!response.body) {
		throw new Error("AI 未返回流式响应。");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();

	return new ReadableStream({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) {
				controller.close();
				return;
			}

			const text = decoder.decode(value, { stream: true });
			const lines = text.split("\n");

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith("data: ")) continue;

				const data = trimmed.slice(6);
				if (data === "[DONE]") {
					controller.close();
					return;
				}

				try {
					const parsed = JSON.parse(data) as {
						choices?: Array<{ delta?: { content?: string } }>;
					};
					const content = parsed.choices?.[0]?.delta?.content;
					if (content) {
						controller.enqueue(encoder.encode(content));
					}
				} catch {
					continue;
				}
			}
		},
	});
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
