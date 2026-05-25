import { loadAiSettings } from "@/lib/storage";

export async function fetchWithAiHeaders(
	url: string,
	init?: RequestInit,
): Promise<Response> {
	const settings = loadAiSettings();
	const headers = new Headers(init?.headers);

	headers.set("Content-Type", "application/json");

	if (settings.apiKey) {
		headers.set("x-ai-api-key", settings.apiKey);

		if (settings.baseUrl) {
			headers.set("x-ai-base-url", settings.baseUrl);
		}

		if (settings.model) {
			headers.set("x-ai-model", settings.model);
		}
	}

	return fetch(url, { ...init, headers });
}
