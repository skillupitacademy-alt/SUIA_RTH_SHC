import { afterEach, expect, it, vi } from 'vitest';

type WorkerEvent = {
  request?: { method: string; url: string; mode?: RequestMode };
  respondWith?: (response: Promise<Response>) => void;
  waitUntil?: (operation: Promise<unknown>) => void;
};

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
async function runNavigation(path: string) {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const put = vi.fn().mockResolvedValue(undefined);
  const cache = { match: vi.fn().mockResolvedValue(undefined), put };
  vi.stubGlobal('self', { location: { origin: 'https://fixture.invalid' }, __SW_MANIFEST: [], addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler) });
  vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(cache) });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('fixture', { status: 200 })));
  await import('../sw');
  let response: Promise<Response> | undefined;
  handlers.get('fetch')!({ request: { method: 'GET', url: `https://fixture.invalid${path}`, mode: 'navigate' }, respondWith: (p: Promise<Response>) => { response = p; } });
  await response;
  return put;
}
it('does not cache authenticated student navigation', async () => {
  expect(await runNavigation('/student')).not.toHaveBeenCalled();
});
it('treats public catalog navigation as network-only and does not cache per Sol D2', async () => {
  // Sol D2 (c166119a): Select network-only HTML/navigation, RSC and API responses for SkillUp, including /programs.
  // Obsolete catalog caching positive replaced per authorized D2 policy.
  expect(await runNavigation('/programs')).not.toHaveBeenCalled();
});
it('does not serve a prior private navigation while offline', async () => {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const cache = { match: vi.fn().mockResolvedValue(new Response('prior-private-fixture', { status: 200 })), put: vi.fn() };
  vi.stubGlobal('self', { location: { origin: 'https://fixture.invalid' }, __SW_MANIFEST: [], addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler) });
  vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(cache) });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline fixture')));
  await import('../sw');
  let response: Promise<Response> | undefined;
  handlers.get('fetch')!({ request: { method: 'GET', url: 'https://fixture.invalid/student', mode: 'navigate' }, respondWith: (p: Promise<Response>) => { response = p; } });
  const result = await response!;
  expect(await result.text()).not.toBe('prior-private-fixture');
});
it('never caches or serves stale /api/* or RSC responses and returns 503 offline', async () => {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const cache = { match: vi.fn().mockResolvedValue(new Response('stale-api-fixture', { status: 200 })), put: vi.fn() };
  const open = vi.fn().mockResolvedValue(cache);
  vi.stubGlobal('self', { location: { origin: 'https://fixture.invalid' }, __SW_MANIFEST: [], addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler) });
  vi.stubGlobal('caches', { open });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline fixture')));
  await import('../sw');

  for (const path of ['/api/student/dashboard', '/student?_rsc=123']) {
    let response: Promise<Response> | undefined;
    handlers.get('fetch')!({ request: { method: 'GET', url: `https://fixture.invalid${path}`, mode: 'cors' }, respondWith: (p: Promise<Response>) => { response = p; } });
    const result = await response!;
    expect(result.status).toBe(503);
    expect(await result.text()).not.toBe('stale-api-fixture');
  }
  expect(open).not.toHaveBeenCalled();
  expect(cache.match).not.toHaveBeenCalled();
  expect(cache.put).not.toHaveBeenCalled();
});
it('caches immutable /_next/static/* assets when online', async () => {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const put = vi.fn().mockResolvedValue(undefined);
  const cache = { match: vi.fn().mockResolvedValue(undefined), put };
  vi.stubGlobal('self', { location: { origin: 'https://fixture.invalid' }, __SW_MANIFEST: [], addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler) });
  vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(cache) });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('console.log(1);', { status: 200 })));
  await import('../sw');
  let response: Promise<Response> | undefined;
  handlers.get('fetch')!({ request: { method: 'GET', url: 'https://fixture.invalid/_next/static/chunks/main.js', mode: 'no-cors' }, respondWith: (p: Promise<Response>) => { response = p; } });
  const result = await response!;
  expect(result.status).toBe(200);
  expect(put).toHaveBeenCalledTimes(1);
});
it('deletes legacy skillup-app-shell-v1 during activation without touching unrelated caches', async () => {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const deleteMock = vi.fn().mockResolvedValue(true);
  const claimMock = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('self', {
    location: { origin: 'https://fixture.invalid' },
    __SW_MANIFEST: [],
    clients: { claim: claimMock },
    addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler)
  });
  vi.stubGlobal('caches', { delete: deleteMock });
  await import('../sw');

  const waitUntil = vi.fn((p: Promise<unknown>) => p);
  handlers.get('activate')!({ waitUntil });
  await waitUntil.mock.results[0].value;

  expect(deleteMock).toHaveBeenCalledWith('skillup-app-shell-v1');
  expect(deleteMock).not.toHaveBeenCalledWith('skillup-static-assets-v2');
  expect(claimMock).toHaveBeenCalled();
});
it('returns 503 offline for /programs despite prior cache entries per Sol D2', async () => {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const cache = { match: vi.fn().mockResolvedValue(new Response('stale-catalog', { status: 200 })), put: vi.fn() };
  vi.stubGlobal('self', { location: { origin: 'https://fixture.invalid' }, __SW_MANIFEST: [], addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler) });
  vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(cache) });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline fixture')));
  await import('../sw');

  let response: Promise<Response> | undefined;
  handlers.get('fetch')!({ request: { method: 'GET', url: 'https://fixture.invalid/programs', mode: 'navigate' }, respondWith: (p: Promise<Response>) => { response = p; } });
  const result = await response!;
  expect(result.status).toBe(503);
  expect(await result.text()).toBe('offline');
});
