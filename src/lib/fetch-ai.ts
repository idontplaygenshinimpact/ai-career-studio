import { loadAiSettings } from "@/lib/storage";

export type AiRequestErrorCode = "aborted" | "timeout" | "network";

export class AiRequestError extends Error {
	readonly code: AiRequestErrorCode;

	constructor(code: AiRequestErrorCode, message: string) {
		super(message);
		this.name = "AiRequestError";
		this.code = code;
	}
}

export type FetchWithAiHeadersInit = RequestInit & {
	timeoutMs?: number;
	retries?: number;
	retryDelayMs?: number;
	onRetry?: (attempt: number, reason: string) => void;
};

function wait(ms: number) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createAbortSignal(signal: AbortSignal | null, timeoutMs: number) {
	const controller = new AbortController();
	let timeoutId: number | null = null;
	let timedOut = false;

	const abortFromExternal = () => {
		controller.abort(signal?.reason);
	};

	if (signal) {
		if (signal.aborted) {
			abortFromExternal();
		} else {
			signal.addEventListener("abort", abortFromExternal, { once: true });
		}
	}

	if (timeoutMs > 0) {
		timeoutId = window.setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, timeoutMs);
	}

	return {
		signal: controller.signal,
		isTimedOut: () => timedOut,
		cleanup: () => {
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId);
			}
			if (signal) {
				signal.removeEventListener("abort", abortFromExternal);
			}
		},
	};
}

function shouldRetryResponse(response: Response) {
	return response.status === 429 || response.status >= 500;
}

export async function fetchWithAiHeaders(
	url: string,
	init?: FetchWithAiHeadersInit,
): Promise<Response> {
	const settings = loadAiSettings();
	const headers = new Headers(init?.headers);
	const timeoutMs = init?.timeoutMs ?? 25_000;
	const retries = init?.retries ?? 0;
	const retryDelayMs = init?.retryDelayMs ?? 700;

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

	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt += 1) {
		const abort = createAbortSignal(init?.signal ?? null, timeoutMs);

		try {
			const response = await fetch(url, {
				...init,
				headers,
				signal: abort.signal,
			});

			if (attempt < retries && shouldRetryResponse(response)) {
				init?.onRetry?.(attempt + 1, `HTTP ${response.status}`);
				await wait(retryDelayMs * (attempt + 1));
				continue;
			}

			return response;
		} catch {
			if (abort.isTimedOut()) {
				lastError = new AiRequestError("timeout", "AI 请求超时，请稍后重试。 ");
			} else if (init?.signal?.aborted) {
				throw new AiRequestError("aborted", "AI 请求已取消。 ");
			} else {
				lastError = new AiRequestError("network", "AI 请求网络异常，请检查连接后重试。 ");
			}

			if (attempt < retries) {
				const reason = lastError instanceof Error ? lastError.message : "请求失败";
				init?.onRetry?.(attempt + 1, reason);
				await wait(retryDelayMs * (attempt + 1));
			}
		} finally {
			abort.cleanup();
		}
	}

	throw lastError instanceof Error
		? lastError
		: new AiRequestError("network", "AI 请求失败，请稍后重试。 ");
}
