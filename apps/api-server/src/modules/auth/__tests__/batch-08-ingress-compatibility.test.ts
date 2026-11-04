import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxyAuthRequest } from '../../../../../../src/share-branding/auth/authBffRoute';
import { unifiedFetch } from '../../../../../../src/share-branding/lib/unifiedFetch';

vi.mock('../../../../../../src/share-branding/lib/unifiedFetch', () => ({ unifiedFetch: vi.fn() }));

describe('B08-T05 actual shared auth BFF forwarding', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
  it.each(['skillup', 'realtutorialhub'])('retains credentials and subject metadata for %s', async (brand) => {
    vi.stubEnv('GATEWAY_URL', 'https://gateway.invalid');
    vi.mocked(unifiedFetch).mockResolvedValue(new Response('{}', { status: 200 }));
    const host = brand === 'skillup' ? 'skillupitacademy.com' : 'realtutorialhub.com';
    const request = new NextRequest(`https://${host}/api/auth/sessions`, { headers: {
      host, authorization: 'Bearer disposable-token', cookie: 'accessToken=disposable-cookie',
      'x-user-id': 'local-subject',
    } });
    const response = await proxyAuthRequest(request, { fallbackApiBase: 'https://fallback.invalid', authPath: 'sessions' });
    expect(response.status).toBe(200);
    expect(vi.mocked(unifiedFetch)).toHaveBeenCalledOnce();
    const forwarded = new Headers(vi.mocked(unifiedFetch).mock.calls[0][1]?.headers);
    expect(forwarded.get('authorization')).toBe('Bearer disposable-token');
    expect(forwarded.get('cookie')).toBe('accessToken=disposable-cookie');
    expect(forwarded.get('x-user-id')).toBe('local-subject');
    expect(forwarded.get('x-brand')).toBe(brand);
  });
});

