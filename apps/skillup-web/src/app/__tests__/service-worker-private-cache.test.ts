import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
async function runNavigation(path: string) {
  const handlers = new Map<string, (event: any) => void>();
  const put = vi.fn().mockResolvedValue(undefined);
  const cache = { match: vi.fn().mockResolvedValue(undefined), put };
  vi.stubGlobal('self', { location: { origin: 'https://fixture.invalid' }, __SW_MANIFEST: [], addEventListener: (name: string, handler: (event: any) => void) => handlers.set(name, handler) });
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
it('retains public navigation caching', async () => {
  expect(await runNavigation('/programs')).toHaveBeenCalledOnce();
});
