import { TokenService } from '@quiz/auth';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  service: undefined as unknown,
  unavailable: false,
  session: vi.fn(),
  account: vi.fn(),
  details: vi.fn(),
}));
vi.mock('@/modules/core/container', () => ({ container: { get: (type: { name: string }) => {
  if (type.name === 'UserRepository') return { findActiveUserWithRoles: state.account, findByIdWithDetails: state.details };
  if (type.name === 'TokenRepository') return { findValidSession: state.session };
  if (state.unavailable) throw new Error('Private configuration failure');
  return state.service;
} } }));
vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: () => ({ db: { select: vi.fn() }, tables: {} }),
  shouldUseBrandBinding: () => false,
}));
vi.mock('@/lib/metrics', () => ({ recordCounter: vi.fn() }));
vi.mock('@/middleware/observability.middleware', () => ({
  withObservability: (handler: (request: NextRequest, context: { requestId: string }) => Promise<Response>) =>
    (request: NextRequest) => handler(request, { requestId: 'unit-device-session' }),
}));

import { GET } from '../route';

const key = new TextEncoder().encode('r4-disposable-learner-key-32-bytes');
const service = new TokenService(key, key, key);
const identity = '00000000-0000-4000-8000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  state.service = service;
  state.unavailable = false;
  state.session.mockResolvedValue({ id: 'persisted-device-a' });
  state.account.mockResolvedValue({ id: identity, roles: ['student'], isBlocked: false, deletedAt: null });
  state.details.mockResolvedValue({ id: identity, email: 'fixture@example.invalid', createdAt: new Date(), profile: {}, isBlocked: false });
});

async function request(refresh: string | undefined = 'issued-device-a', bind = 'issued-device-a', expiration = '1h') {
  const access = await service.generateAccessToken({
    userId: identity, originalUserId: identity, shadowUserId: identity,
    email: 'fixture@example.invalid', roles: ['student'], isAdmin: false,
    tokenType: 'user', brand: 'skillup', sessionBinding: await service.hashToken(bind),
  }, expiration);
  return new NextRequest('http://skillup.localhost:3009/api/auth/me', {
    headers: { host: 'skillup.localhost:3009', 'x-brand': 'skillup', cookie: `accessToken=${access}${refresh === undefined ? '' : `; refreshToken=${refresh}`}` },
  });
}

describe('learner identity route with real JWT verification and isolated account/session repositories', () => {
  it('admits the correct persisted pair and marks the response private', async () => {
    const response = await GET(await request());
    expect(response.status, await response.clone().text()).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it('rejects missing refresh credentials', async () => {
    const missing = await request();
    missing.cookies.delete('refreshToken');
    expect((await GET(missing)).status).toBe(401);
    expect(state.session).not.toHaveBeenCalled();
  });
  it('rejects a different device refresh credential before session lookup', async () => {
    expect((await GET(await request('issued-device-b'))).status).toBe(401);
    expect(state.session).not.toHaveBeenCalled();
  });
  it('rejects a revoked exact device pair', async () => {
    state.session.mockResolvedValue(null);
    expect((await GET(await request())).status).toBe(401);
  });
  it('rejects a cryptographically valid expired access token', async () => {
    expect((await GET(await request('issued-device-a', 'issued-device-a', '-1s'))).status).toBe(401);
    expect(state.session).not.toHaveBeenCalled();
  });
  it('returns a sanitized 503 on session-store failure', async () => {
    state.session.mockRejectedValue(new Error('Private database connection detail'));
    const response = await GET(await request());
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.text()).not.toContain('Private');
  });
  it('returns a sanitized 503 on TokenService construction failure', async () => {
    const incoming = await request();
    state.unavailable = true;
    const response = await GET(incoming);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('Private');
  });
});
