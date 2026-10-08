import { describe, it, expect } from 'vitest';
import type { NextRequest } from 'next/server';

import { TokenService } from '../token.service';

const makeReq = (cookies: Record<string, string | undefined>, authHeader?: string): NextRequest => {
  return {
    cookies: {
      get: (key: string) => (cookies[key] ? { value: cookies[key]! } : undefined),
    },
    headers: {
      get: (_key: string) => authHeader ?? null,
    },
  } as unknown as NextRequest;
};

describe('TokenService branch edges', () => {
  it('returns infra cookie only when infrastructure scope is explicit', () => {
    const req = makeReq({
      infra_accessToken: 'INFRA123',
      accessToken: undefined,
      admin_accessToken: undefined,
    });

    const service = new TokenService();
    const token = service.getAccessToken(req, { scope: 'infrastructure' });

    expect(token).toBe('INFRA123');
  });

  it('getExpiration returns null on malformed token', () => {
    const service = new TokenService();
    const result = service.getExpiration('not-a-jwt');
    expect(result).toBeNull();
  });
});
