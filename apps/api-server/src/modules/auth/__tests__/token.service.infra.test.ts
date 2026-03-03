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
  it('returns infra cookie when scope is default and only infra token is set', () => {
    const req = makeReq({
      infra_accessToken: 'INFRA123',
      accessToken: undefined,
      admin_accessToken: undefined,
    });

    const token = TokenService.getAccessToken(req);

    expect(token).toBe('INFRA123');
  });

  it('getExpiration returns null on malformed token', () => {
    const result = TokenService.getExpiration('not-a-jwt');
    expect(result).toBeNull();
  });
});
