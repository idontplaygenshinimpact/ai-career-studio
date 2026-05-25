import type { AiConfig } from "@/lib/ai-client";

export function extractAiConfigFromHeaders(request: Request): AiConfig | undefined {
	const apiKey = request.headers.get("x-ai-api-key");

	if (!apiKey) {
		return undefined;
	}

	return {
		apiKey,
		baseUrl: request.headers.get("x-ai-base-url") || undefined,
		model: request.headers.get("x-ai-model") || undefined,
	};
}
