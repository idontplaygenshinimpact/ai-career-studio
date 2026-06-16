const CACHE_VERSION = "acs-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const PRECACHE_PAGES = ["/", "/jd-match", "/resume-review", "/project-polish", "/mock-interview", "/coding-practice", "/resume-versions"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(PAGE_CACHE).then((cache) => cache.addAll(PRECACHE_PAGES)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key)).map((key) => caches.delete(key))),
		),
	);
	self.clients.claim();
});

async function cacheFirst(request) {
	const cached = await caches.match(request);
	if (cached) return cached;

	const response = await fetch(request);
	if (response.ok) {
		const cache = await caches.open(STATIC_CACHE);
		cache.put(request, response.clone());
	}
	return response;
}

async function networkFirst(request) {
	try {
		const response = await fetch(request);
		if (response.ok && request.method === "GET") {
			const cache = await caches.open(PAGE_CACHE);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		const fallback = await caches.match("/");
		return cached || fallback || new Response("Offline", { status: 503 });
	}
}

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
		return;
	}

	if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg" || url.pathname === "/manifest.json") {
		event.respondWith(cacheFirst(event.request));
		return;
	}

	event.respondWith(networkFirst(event.request));
});
