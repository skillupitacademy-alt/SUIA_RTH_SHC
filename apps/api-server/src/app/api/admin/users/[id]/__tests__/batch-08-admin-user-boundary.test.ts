import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@quiz/db';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { GET } from '../route';

vi.mock('@/modules/auth/rbac.service', () => ({ _verifyAdmin: vi.fn(), _verifyActiveAccount: vi.fn() }));
vi.mock('@quiz/db', () => ({ db: { query: { users: { findFirst: vi.fn() } } } }));
vi.mock('@/modules/admin-engine/admin.engine', () => ({ AdminUserEngine: { updateUser: vi.fn(), deleteUser: vi.fn() } }));
const key = new TextEncoder().encode('admin-users-isolated-test-key-32bytes!');
const service = new TokenService(key, key, key);
const previous = container.get(TokenService);
async function request(type: 'admin' | 'user') {
  const token = await service.generateAccessToken({ userId: 'principal', originalUserId: 'principal', shadowUserId: 'principal',
    email: 'principal@example.test', roles: [type === 'admin' ? 'admin' : 'student'], isAdmin: type === 'admin',
    brand: 'skillhubcore', tokenType: type, aud: type === 'admin' ? 'shc-admin' : 'user' });
  return new NextRequest('http://localhost/api/admin/users/target', { headers: {
    authorization: `Bearer ${token}`, 'x-portal-identity': 'shc-admin', 'x-user-id': 'forged', 'x-brand': 'realtutorialhub',
  } });
}
describe('admin user actual entry effect boundary', () => {
  beforeEach(() => { vi.clearAllMocks(); container.register(TokenService, service); vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'target' } as never); });
  afterEach(() => container.register(TokenService, previous));
  it('allows signed SHC admin to reach the selected default-store resource', async () => {
    const response = await GET(await request('admin'), { params: Promise.resolve({ id: 'target' }) });
    expect(response.status).toBe(200); expect(db.query.users.findFirst).toHaveBeenCalledTimes(1);
  });
  it('denies a learner at the guard before a privileged read', async () => {
    const response = await GET(await request('user'), { params: Promise.resolve({ id: 'target' }) });
    expect(response.status).toBeGreaterThanOrEqual(400); expect(db.query.users.findFirst).not.toHaveBeenCalled();
  });
});
