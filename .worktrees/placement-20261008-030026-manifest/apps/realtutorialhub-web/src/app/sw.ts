/// <reference lib="webworker" />

export {};

const CACHE_NAME = 'rth-subtopic-blocks-v1';
const MAX_ENTRIES = 5;
type PrecacheEntry = string | { url: string; revision: string | null };
type RTHWorkerEventMap = {
  install: ExtendableEvent;
  activate: ExtendableEvent;
  fetch: FetchEvent;
};

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: PrecacheEntry[] };

const precacheManifest = self.__SW_MANIFEST;
const sw = self as unknown as ServiceWorkerGlobalScope & {
  addEventListener<K extends keyof RTHWorkerEventMap>(type: K, listener: (event: RTHWorkerEventMap[K]) => void): void;
};

sw.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      void precacheManifest;
      await sw.skipWaiting();
    })()
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim());
});

sw.addEventListener('fetch', (event) => {
  const request = event.request as Request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/tutorial/content/')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
          const keys = [...(await cache.keys())];
          while (keys.length > MAX_ENTRIES) {
            const oldest = keys.shift();
            if (oldest) {
              await cache.delete(oldest);
            }
          }
        }
        return response;
      } catch {
        return cached ?? new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'content-type': 'application/json' } });
      }
    })()
  );
});
