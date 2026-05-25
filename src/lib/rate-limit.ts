const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

const ipRequests = new Map<string, number[]>();

function cleanupOldEntries(timestamps: number[], now: number) {
	const cutoff = now - REQUEST_WINDOW_MS;
	return timestamps.filter((t) => t > cutoff);
}

export function checkRateLimit(request: Request): { allowed: boolean; retryAfterMs: number } {
	const forwarded = request.headers.get("x-forwarded-for");
	const ip = forwarded?.split(",")[0]?.trim() || "unknown";
	const now = Date.now();

	const timestamps = cleanupOldEntries(ipRequests.get(ip) || [], now);

	if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
		const oldest = timestamps[0];
		const retryAfterMs = oldest + REQUEST_WINDOW_MS - now;
		ipRequests.set(ip, timestamps);
		return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
	}

	timestamps.push(now);
	ipRequests.set(ip, timestamps);
	return { allowed: true, retryAfterMs: 0 };
}

setInterval(() => {
	const now = Date.now();
	const cutoff = now - REQUEST_WINDOW_MS * 2;
	for (const [ip, timestamps] of ipRequests) {
		const latest = timestamps[timestamps.length - 1];
		if (!latest || latest < cutoff) {
			ipRequests.delete(ip);
		}
	}
}, REQUEST_WINDOW_MS);
