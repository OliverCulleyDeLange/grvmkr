/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE_PREFIX = 'grvmkr-';
const CACHE_SCHEMA_VERSION = 2;
const CACHE = `${CACHE_PREFIX}v${CACHE_SCHEMA_VERSION}-${version}`;
const APP_SHELL = new URL('./', worker.location.href).pathname;
const PRECACHE = [...new Set([...build, ...files, ...prerendered])];
const PRECACHE_URLS = new Set(PRECACHE.map((path) => new URL(path, worker.location.origin).href));

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => worker.skipWaiting())
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const names = await caches.keys();
			await Promise.all(
				names
					.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE)
					.map((name) => caches.delete(name))
			);
			await worker.clients.claim();
		})()
	);
});

worker.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== worker.location.origin) return;

	if (request.mode === 'navigate') {
		event.respondWith(navigate(request));
		return;
	}

	// Only cache the exact production assets supplied by SvelteKit. In
	// development, Vite uses query strings to serve a component's script and
	// scoped CSS from the same path; caching arbitrary requests (especially
	// while ignoring their query string) makes those resources collide.
	if (!PRECACHE_URLS.has(request.url)) return;

	event.respondWith(cacheFirst(request));
});

async function navigate(request: Request): Promise<Response> {
	try {
		const response = await fetch(request);
		if (response.ok) {
			const cache = await caches.open(CACHE);
			await cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cache = await caches.open(CACHE);
		return (
			(await cache.match(request, { ignoreSearch: true })) ??
			(await cache.match(APP_SHELL)) ??
			new Response('GrvMkr is offline and its app shell is unavailable.', {
				status: 503,
				headers: { 'Content-Type': 'text/plain; charset=utf-8' }
			})
		);
	}
}

async function cacheFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(request);
	if (cached) return cached;

	const response = await fetch(request);
	if (response.ok && response.type === 'basic') {
		await cache.put(request, response.clone());
	}
	return response;
}
