import { describe, expect, it, vi } from 'vitest';

import { proxyRequest } from '../proxy';

describe('proxyRequest', () => {
  it('uses the trusted public hostname and removes Expect before proxying', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));

    const request = new Request('http://127.0.0.1:8787/auth/login', {
      method: 'POST',
      headers: {
        Expect: '100-continue',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ example: true }),
    });

    await proxyRequest(request, 'http://localhost:3000', {
      requestId: 'request-1',
      gatewaySecret: 'gateway-secret',
      publicHostname: 'skillup.localhost',
      upstreamPath: '/api/auth/login',
    });

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get('expect')).toBeNull();
    expect(headers.get('x-original-host')).toBe('skillup.localhost');
    expect(headers.get('x-forwarded-host')).toBe('127.0.0.1');

    fetchSpy.mockRestore();
  });
});
