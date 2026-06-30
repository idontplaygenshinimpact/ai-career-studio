/**
 * Sliding Window Log 限流实现。
 *
 * 说明：
 * - 每个 IP 在单实例内保存最近请求的时间戳日志，按滑动窗口统计请求数。
 * - 当前实现只适用于单实例 / 单进程内存限流；如果是多实例、Serverless、水平扩容部署，
 *   需要把窗口日志和计数状态放到 Redis、Upstash Redis、DynamoDB 等外部共享存储中，
 *   否则不同实例之间无法共享限流状态。
 * - 为控制内存占用，最多保留 MAX_IP_ENTRIES 个 IP 条目，超出时按 LRU 淘汰最久未访问的条目。
 */
const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_IP_ENTRIES = 1024;

type RateLimitEntry = {
	timestamps: number[];
	lastAccessedAt: number;
};

const ipRequests = new Map<string, RateLimitEntry>();

function getIp(request: Request) {
	const forwarded = request.headers.get("x-forwarded-for");
	return forwarded?.split(",")[0]?.trim() || "unknown";
}

function pruneTimestamps(timestamps: number[], now: number) {
	const cutoff = now - REQUEST_WINDOW_MS;
	while (timestamps.length > 0 && timestamps[0] <= cutoff) {
		timestamps.shift();
	}
}

function touchEntry(ip: string, entry: RateLimitEntry, now: number) {
	entry.lastAccessedAt = now;
	ipRequests.delete(ip);
	ipRequests.set(ip, entry);
}

function evictLeastRecentlyUsedEntries() {
	while (ipRequests.size > MAX_IP_ENTRIES) {
		const oldestKey = ipRequests.keys().next().value;
		if (oldestKey === undefined) {
			break;
		}
		ipRequests.delete(oldestKey);
	}
}

export function checkRateLimit(request: Request): { allowed: boolean; retryAfterMs: number } {
	const ip = getIp(request);
	const now = Date.now();
	const existingEntry = ipRequests.get(ip);
	const entry: RateLimitEntry = existingEntry ?? { timestamps: [], lastAccessedAt: now };

	pruneTimestamps(entry.timestamps, now);

	if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
		const oldest = entry.timestamps[0];
		entry.lastAccessedAt = now;
		if (existingEntry) {
			touchEntry(ip, entry, now);
		} else {
			ipRequests.set(ip, entry);
		}
		evictLeastRecentlyUsedEntries();
		return { allowed: false, retryAfterMs: Math.max(0, oldest + REQUEST_WINDOW_MS - now) };
	}

	entry.timestamps.push(now);
	entry.lastAccessedAt = now;
	if (existingEntry) {
		touchEntry(ip, entry, now);
	} else {
		ipRequests.set(ip, entry);
	}

	evictLeastRecentlyUsedEntries();
	return { allowed: true, retryAfterMs: 0 };
}

const cleanupTimer = setInterval(() => {
	const now = Date.now();
	const cutoff = now - REQUEST_WINDOW_MS;

	for (const [ip, entry] of ipRequests) {
		pruneTimestamps(entry.timestamps, now);
		if (entry.timestamps.length === 0 && entry.lastAccessedAt <= cutoff) {
			ipRequests.delete(ip);
		}
	}

	evictLeastRecentlyUsedEntries();
}, REQUEST_WINDOW_MS);

if (typeof cleanupTimer === "object" && cleanupTimer !== null && "unref" in cleanupTimer && typeof cleanupTimer.unref === "function") {
	cleanupTimer.unref();
}
