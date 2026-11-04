import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@quiz/db';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { GET } from '../route';

const accountState = vi.hoisted(() => ({ row: undefined as undefined | { isBlocked: boolean }, reads: 0 }));
vi.mock('@quiz/db', async original => ({ ...await original<typeof import('@quiz/db')>(), db: { query: { users: { findFirst: vi.fn(async () => ({ id: 'target' })) } } } }));
vi.mock('@/modules/auth/brand-db', async () => {
  const { users } = await import('@quiz/db');
  return { shouldUseBrandBinding: () => true, getAuthBrandContext: () => ({ tables: { users }, db: {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => { accountState.reads++; return accountState.row ? [accountState.row] : []; } }) }) }),
  } }) };
});
vi.mock('@/modules/admin-engine/admin.engine', () => ({ AdminUserEngine: { updateUser: vi.fn(), deleteUser: vi.fn() } }));
const key = new TextEncoder().encode('tenant-admin-isolated-secret-32bytes!');
const tokens = new TokenService(key, key, key);
const previous = container.get(TokenService);
async function request(kind: 'admin' | 'learner' | 'wrong-aud') {
  const token = await tokens.generateAccessToken({ userId: 'principal', originalUserId: 'principal', shadowUserId: 'principal',
    email: 'admin@example.test', roles: kind === 'learner' ? ['student'] : ['admin'], brand: 'skillup',
    tokenType: kind === 'learner' ? 'user' : 'admin', isAdmin: kind !== 'learner', aud: kind === 'admin' ? 'admin' : 'user' });
  return new NextRequest('http://localhost/api/admin/users/target', { headers: { authorization: `Bearer ${token}`, 'x-portal-identity': 'admin' } });
}
describe('tenant-admin user entry and real RBAC helper', () => {
  beforeEach(() => { vi.clearAllMocks(); accountState.row = { isBlocked: false }; accountState.reads = 0; container.register(TokenService, tokens); });
  afterEach(() => container.register(TokenService, previous));
  it('allows an active tenant admin to read', async () => {
    const response = await GET(await request('admin'), { params: Promise.resolve({ id: 'target' }) });
    expect(response.status).toBe(200); expect(accountState.reads).toBe(1); expect(db.query.users.findFirst).toHaveBeenCalledTimes(1);
  });
  it.each(['blocked', 'missing'])('denies %s tenant account before resource read', async state => {
    accountState.row = state === 'blocked' ? { isBlocked: true } : undefined;
    const response = await GET(await request('admin'), { params: Promise.resolve({ id: 'target' }) });
    expect(response.status).toBe(403); expect(accountState.reads).toBe(1); expect(db.query.users.findFirst).not.toHaveBeenCalled();
  });
  it.each(['learner', 'wrong-aud'] as const)('denies %s before account and resource reads', async kind => {
    const response = await GET(await request(kind), { params: Promise.resolve({ id: 'target' }) });
    expect.soft(response.status).toBe(401); expect(accountState.reads).toBe(0); expect(db.query.users.findFirst).not.toHaveBeenCalled();
  });
});
