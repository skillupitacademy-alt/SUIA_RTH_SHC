import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.hoisted(() => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/headers', () => request);
import { fetchBackendAuthState } from '../serverAuthState';

describe('server profile request deadlines', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('NODE_ENV', 'test');
    request.headers.mockResolvedValue(new Headers({ host: 'skillup.localhost:3009' }));
    request.cookies.mockResolvedValue({ getAll: () => [{ name: 'accessToken', value: 'test-only' }] });
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('forwards cookies through the same gateway without caching and clears its deadline', async () => {
    const user = { id: 'student-a', email: 'student@example.invalid' };
    fetchMock.mockResolvedValue(Response.json(user));
    expect(await fetchBackendAuthState()).toEqual(user);
    expect(fetchMock).toHaveBeenCalledWith('https://skillup.localhost:3009/api/profile', expect.objectContaining({
      headers: { cookie: 'accessToken=test-only', 'Cache-Control': 'no-cache' }, cache: 'no-store',
    }));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not request a profile or create a timer without cookies', async () => {
    request.cookies.mockResolvedValue({ getAll: () => [] });
    expect(await fetchBackendAuthState()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not retry a 401 or accept its response body as an authenticated user', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 'untrusted' }, { status: 401 }));
    expect(await fetchBackendAuthState()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts the deadline after asynchronous request context preparation', async () => {
    request.cookies.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      getAll: () => [{ name: 'accessToken', value: 'test-only' }],
    }), 4000)));
    fetchMock.mockImplementation(async (_url, options) => {
      expect(options.signal.aborted).toBe(false);
      return Response.json({ id: 'student-a' });
    });
    const pending = fetchBackendAuthState();
    await vi.advanceTimersByTimeAsync(4000);
    expect(await pending).toEqual({ id: 'student-a' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('allows a four-second development cold route response', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    fetchMock.mockImplementation((_url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      setTimeout(() => resolve(Response.json({ id: 'student-a' })), 4000);
    }));
    const pending = fetchBackendAuthState();
    await vi.advanceTimersByTimeAsync(4000);
    expect(await pending).toEqual({ id: 'student-a' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bounds hung requests, retries, and returns no profile without an AbortError console stack', async () => {
    fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const pending = fetchBackendAuthState();
    await vi.advanceTimersByTimeAsync(9300);
    expect(await pending).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(console.warn).toHaveBeenCalledWith('[AUTH_STATE] Profile retries exhausted; returning no profile', {
      reason: 'profile request timed out',
    });
    expect(console.error).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears failed-attempt timers and recovers from a transient transport failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('transport')).mockResolvedValueOnce(Response.json({ id: 'student-a' }));
    const pending = fetchBackendAuthState();
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toEqual({ id: 'student-a' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
