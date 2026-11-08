import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';

import { proxyRequest } from '../proxy';
import { resolveTrustedRequestBrand } from '../request-brand';
import { authenticateRequest } from '../../middleware/auth';

describe('B08-T06 gateway proxy transport', () => {
  afterEach(() => vi.restoreAllMocks());

  it('verifies and reconstructs distinct signed identity claims before forwarding', async () => {
    const secret = 'gateway-disposable-secret-32-bytes';
    const token = await new SignJWT({ userId: 'payload-user', originalUserId: 'local-original', shadowUserId: 'distinct-shadow', brand: 'skillup', tokenType: 'user', roles: ['student'] })
      .setProtectedHeader({ alg: 'HS256' }).setSubject('distinct-shadow').setAudience('user')
      .sign(new TextEncoder().encode(secret));
    const request = new Request('https://skillupitacademy.com/api/tutorial/progress', { headers: { authorization: `Bearer ${token}` } });
    const result = await authenticateRequest(request, { JWT_SECRET: secret, ADMIN_JWT_SECRET: secret } as never, { prefix: '/api/tutorial' }, 'skillup');
    expect(result).not.toBeInstanceOf(Response);
    if (result instanceof Response) return;
    expect(result.payload).toHaveProperty('userId', 'payload-user');
    expect(result.payload.originalUserId).toBe('local-original');
    expect(result.payload.shadowUserId).toBe('distinct-shadow');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await proxyRequest(request, 'https://upstream.invalid', {
      requestId: 'request-control', gatewaySecret: 'disposable-secret',
      userId: result.payload.originalUserId, originalUserId: result.payload.originalUserId,
      shadowUserId: result.payload.shadowUserId, brand: result.requestBrand, portal: result.portal,
    });
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('x-user-id')).toBe('local-original');
  });

  it.each(['valid', 'invalid', 'missing', 'conflict'])('composes trusted host and signed dispatch: %s', async mode => {
    const secret = 'gateway-disposable-secret-32-bytes';
    const token = await new SignJWT({ userId: 'payload-user', originalUserId: 'local-original', shadowUserId: 'distinct-shadow', brand: mode === 'conflict' ? 'realtutorialhub' : 'skillup', tokenType: 'user', roles: ['student'] })
      .setProtectedHeader({ alg: 'HS256' }).setSubject('distinct-shadow').setAudience('user').sign(new TextEncoder().encode(secret));
    const headers = new Headers({ authorization: `Bearer ${token}`, 'x-forwarded-host': 'user.skillupitacademy.com' });
    if (mode !== 'missing') headers.set('x-internal-secret', mode === 'invalid' ? 'invalid' : 'trusted-key');
    const request = new Request('https://common.example.test/api/tutorial/progress', { headers });
    const context = { env: { INTERNAL_GATEWAY_SECRET: 'trusted-key' }, req: { url: request.url, header: (name: string) => headers.get(name) ?? undefined } };
    const resolved = resolveTrustedRequestBrand(context as never);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    if (!resolved) { expect(['invalid', 'missing']).toContain(mode); expect(fetchMock).not.toHaveBeenCalled(); return; }
    const result = await authenticateRequest(request, { JWT_SECRET: secret, ADMIN_JWT_SECRET: secret } as never, { prefix: '/api/tutorial' }, resolved.brand);
    if (result instanceof Response) { expect(mode).toBe('conflict'); expect(fetchMock).not.toHaveBeenCalled(); return; }
    expect(mode).toBe('valid');
    await proxyRequest(request, 'https://upstream.invalid', { requestId: 'fixture', gatewaySecret: 'trusted-key', userId: result.payload.originalUserId, originalUserId: result.payload.originalUserId, shadowUserId: result.payload.shadowUserId, brand: result.requestBrand, portal: result.portal });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const forwarded = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(forwarded.get('x-user-id')).toBe('local-original'); expect(forwarded.get('x-brand')).toBe('skillup');
  });

  it('forwards reconstructed distinct identity fields, tenant, portal and inherited credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    const request = new Request('https://skillup.test/api/tutorial/progress', {
      headers: {
        authorization: 'Bearer disposable-credential',
        cookie: 'accessToken=disposable-cookie',
        'x-user-id': 'untrusted-value',
        'x-brand': 'realtutorialhub',
      },
    });
    await proxyRequest(request, 'https://upstream.invalid', {
      requestId: 'request-control', gatewaySecret: 'disposable-secret',
      userId: 'local-original', originalUserId: 'local-original', shadowUserId: 'distinct-shadow',
      brand: 'skillup', portal: 'user',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('x-user-id')).toBe('local-original');
    expect(headers.get('x-original-user-id')).toBe('local-original');
    expect(headers.get('x-shadow-user-id')).toBe('distinct-shadow');
    expect(headers.get('x-brand')).toBe('skillup');
    expect(headers.get('x-portal-identity')).toBe('user');
    expect(headers.get('authorization')).toBe('Bearer disposable-credential');
    expect(headers.get('cookie')).toBe('accessToken=disposable-cookie');
    expect(headers.get('x-internal-secret')).toBe('disposable-secret');
  });
});
