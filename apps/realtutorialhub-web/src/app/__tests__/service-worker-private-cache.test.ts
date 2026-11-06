import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function setupRthServiceWorker(options: {
  fetchImpl: ReturnType<typeof vi.fn>;
  cachedResponse?: Response;
}) {
  const handlers = new Map<string, (event: any) => void>();
  const put = vi.fn().mockResolvedValue(undefined);
  const match = vi.fn().mockResolvedValue(options.cachedResponse);
  const open = vi.fn().mockResolvedValue({ match, put });
  const skipWaiting = vi.fn();
  const claim = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('self', {
    location: { origin: 'https://realtutorialhub.fixture.invalid' },
    addEventListener: (name: string, handler: (event: any) => void) => handlers.set(name, handler),
    skipWaiting,
    clients: { claim },
  });
  vi.stubGlobal('caches', { open, match });
  vi.stubGlobal('fetch', options.fetchImpl);

  await import('../sw');

  return { handlers, open, match, put, skipWaiting, claim };
}

describe('RTH service worker private tutorial content cache controls (GM10 / FND07)', () => {
  it('fetches /api/tutorial/content/* from network without opening or writing Cache API when online', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ subtopicId: 'sub-1', privateContent: 'user-A-only' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const { handlers, open, match, put } = await setupRthServiceWorker({ fetchImpl });

    let responsePromise: Promise<Response> | undefined;
    handlers.get('fetch')!({
      request: {
        method: 'GET',
        url: 'https://realtutorialhub.fixture.invalid/api/tutorial/content/python-basics',
      },
      respondWith: (p: Promise<Response>) => {
        responsePromise = p;
      },
    });

    const response = await responsePromise!;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ subtopicId: 'sub-1', privateContent: 'user-A-only' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    expect(match).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('never serves a stale cached private tutorial response when offline and returns 503 offline JSON', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));
    const stalePrivateResponse = new Response(
      JSON.stringify({ subtopicId: 'sub-1', privateContent: 'stale-user-A-payload' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
    const { handlers, open, match, put } = await setupRthServiceWorker({
      fetchImpl,
      cachedResponse: stalePrivateResponse,
    });

    let responsePromise: Promise<Response> | undefined;
    handlers.get('fetch')!({
      request: {
        method: 'GET',
        url: 'https://realtutorialhub.fixture.invalid/api/tutorial/content/python-basics',
      },
      respondWith: (p: Promise<Response>) => {
        responsePromise = p;
      },
    });

    const response = await responsePromise!;
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'offline' });
    expect(open).not.toHaveBeenCalled();
    expect(match).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('ignores non-GET requests and non-tutorial-content routes without intercepting respondWith', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    const { handlers, open } = await setupRthServiceWorker({ fetchImpl });

    const respondWithPost = vi.fn();
    handlers.get('fetch')!({
      request: {
        method: 'POST',
        url: 'https://realtutorialhub.fixture.invalid/api/tutorial/content/python-basics',
      },
      respondWith: respondWithPost,
    });
    expect(respondWithPost).not.toHaveBeenCalled();

    const respondWithOtherRoute = vi.fn();
    handlers.get('fetch')!({
      request: {
        method: 'GET',
        url: 'https://realtutorialhub.fixture.invalid/api/auth/profile',
      },
      respondWith: respondWithOtherRoute,
    });
    expect(respondWithOtherRoute).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it('handles install and activate lifecycle events cleanly', async () => {
    const fetchImpl = vi.fn();
    const { handlers, skipWaiting, claim } = await setupRthServiceWorker({ fetchImpl });

    let installPromise: Promise<unknown> | undefined;
    handlers.get('install')!({
      waitUntil: (p: Promise<unknown>) => {
        installPromise = p;
      },
    });
    await installPromise;
    expect(skipWaiting).toHaveBeenCalledTimes(1);

    let claimedPromise: Promise<unknown> | undefined;
    handlers.get('activate')!({
      waitUntil: (p: Promise<unknown>) => {
        claimedPromise = p;
      },
    });
    await claimedPromise;
    expect(claim).toHaveBeenCalledTimes(1);
  });
});
