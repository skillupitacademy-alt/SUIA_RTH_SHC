/// <reference lib="webworker" />

export {};

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

  // Content responses can depend on the authenticated learner. Do not read
  // prior Cache API entries or store responses under an unqualified URL.
  event.respondWith(fetch(request).catch(() => new Response(
    JSON.stringify({ error: 'offline' }),
    { status: 503, headers: { 'content-type': 'application/json' } }
  )));
});
