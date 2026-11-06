/// <reference lib="webworker" />

export {};

const CACHE_NAME = 'skillup-static-assets-v2';
const LEGACY_CACHE_NAME = 'skillup-app-shell-v1';

type PrecacheEntry = string | { url: string; revision: string | null };
type SkillupWorkerEventMap = {
  install: ExtendableEvent;
  activate: ExtendableEvent;
  fetch: FetchEvent;
};

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: PrecacheEntry[] };

const precacheManifest = self.__SW_MANIFEST;
const sw = self as unknown as ServiceWorkerGlobalScope & {
  addEventListener<K extends keyof SkillupWorkerEventMap>(type: K, listener: (event: SkillupWorkerEventMap[K]) => void): void;
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
  event.waitUntil((async () => {
    await caches.delete(LEGACY_CACHE_NAME);
    await sw.clients.claim();
  })());
});

sw.addEventListener('fetch', (event) => {
  const request = event.request as Request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (!url.pathname.startsWith('/')) return;

  // Navigation responses can depend on authenticated request context even
  // at a public URL. Only immutable Next static assets use the shared cache.
  const staticAsset = url.pathname.startsWith('/_next/static/');
  if (!staticAsset) {
    event.respondWith(fetch(request).catch(() => new Response('offline', {
      status: 503, headers: { 'content-type': 'text/plain' },
    })));
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (
          cached ??
          new Response('offline', {
            status: 503,
            headers: { 'content-type': 'text/plain' },
          })
        );
      }
    })()
  );
});
