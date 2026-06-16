type ChatCompletionResponse = {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
};

export type AiRequestDebug = {
	model: string;
	promptPreview: string;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	latencyMs: number;
};

export type AiConfig = {
	apiKey?: string;
	baseUrl?: string;
	model?: string;
};

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

function isPrivateIpv4(hostname: string) {
	const parts = hostname.split(".").map((part) => Number(part));
	if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
		return false;
	}

	const [a, b] = parts;
	return (
		a === 10 ||
		a === 127 ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		(a === 169 && b === 254) ||
		a === 0
	);
}

function isUnsafeHostname(hostname: string) {
	const normalized = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
	return (
		normalized === "localhost" ||
		normalized.endsWith(".localhost") ||
		normalized.endsWith(".local") ||
		normalized === "0.0.0.0" ||
		isPrivateIpv4(normalized) ||
		normalized === "::1" ||
		normalized.startsWith("fc") ||
		normalized.startsWith("fd") ||
		normalized.startsWith("fe80")
	);
}

export function validateAiBaseUrl(rawBaseUrl: string): string {
	let url: URL;

	try {
		url = new URL(rawBaseUrl);
	} catch {
		throw new Error("AI Base URL 不是合法 URL，请填写 OpenAI-compatible HTTPS 地址。");
	}

	if (url.protocol !== "https:") {
		throw new Error("AI Base URL 必须使用 HTTPS，不能使用 HTTP 或其他协议。");
	}

	if (url.username || url.password) {
		throw new Error("AI Base URL 不能包含用户名或密码。");
	}

	if (isUnsafeHostname(url.hostname)) {
		throw new Error("AI Base URL 不能指向 localhost、内网地址或本机地址。");
	}

	url.hash = "";
	url.search = "";
	return url.toString().replace(/\/$/, "");
}

export function resolveAiConfig(override?: AiConfig): Required<Omit<AiConfig, "apiKey">> & { apiKey: string } {
	const apiKey = override?.apiKey || process.env.AI_API_KEY || "";
	const baseUrl = validateAiBaseUrl(override?.baseUrl || process.env.AI_BASE_URL || DEFAULT_BASE_URL);
	const model = override?.model || process.env.AI_MODEL || DEFAULT_MODEL;
	return { apiKey, baseUrl, model };
}

export async function requestChatCompletion(
	messages: Array<{ role: "system" | "user"; content: string }>,
	configOverride?: AiConfig,
): Promise<{ content: string; debug: AiRequestDebug }> {
	const config = resolveAiConfig(configOverride);

	if (!config.apiKey) {
		throw new Error(
			"未配置 AI API Key。请在页面右上角「设置」中填入你的 API Key，或在 .env.local 中配置。",
		);
	}

	const startTime = Date.now();
	const response = await fetch(
		`${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.apiKey}`,
			},
			body: JSON.stringify({
				model: config.model,
				temperature: 0.35,
				messages,
			}),
		},
	);
	const latencyMs = Date.now() - startTime;

	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		throw new Error(`AI 请求失败：${response.status} ${detail}`);
	}

	const data = (await response.json()) as ChatCompletionResponse;
	const content = data.choices?.[0]?.message?.content;

	if (!content) {
		throw new Error("AI 返回为空。请检查模型配置。");
	}

	const systemMsg = messages.find((m) => m.role === "system");
	const debug: AiRequestDebug = {
		model: config.model,
		promptPreview: systemMsg ? systemMsg.content.slice(0, 200) : "",
		promptTokens: data.usage?.prompt_tokens ?? 0,
		completionTokens: data.usage?.completion_tokens ?? 0,
		totalTokens: data.usage?.total_tokens ?? 0,
		latencyMs,
	};

	return { content, debug };
}

export async function requestChatStream(
	messages: Array<{ role: "system" | "user"; content: string }>,
	configOverride?: AiConfig,
): Promise<ReadableStream<Uint8Array>> {
	const config = resolveAiConfig(configOverride);

	if (!config.apiKey) {
		throw new Error("未配置 AI API Key，无法调用流式 AI 服务。");
	}

	const response = await fetch(
		`${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.apiKey}`,
			},
			body: JSON.stringify({
				model: config.model,
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
