import { afterEach, describe, expect, it, vi } from 'vitest';
import { FetchClient } from '../fetch-client';

describe('SHC refresh fallback transport boundary', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('attempts refresh at the configured base and retries the original once when it succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'expired' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: 'ready' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new FetchClient('https://shc.example.test/api');
    await expect(client.get('/questions')).resolves.toEqual({ value: 'ready' });
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      'https://shc.example.test/api/questions',
      'https://shc.example.test/api/auth/refresh',
      'https://shc.example.test/api/questions',
    ]);
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('POST');
  });
  it('does not retry the original if the refresh endpoint is unavailable', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'expired' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'not found' }), { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new FetchClient('https://shc.example.test/api');
    await expect(client.get('/questions')).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://shc.example.test/api/auth/refresh');
  });
});
