import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  insert: vi.fn(),
}));
vi.mock('@/lib/auth-context', () => ({ getAuthContext: mocks.auth }));
vi.mock('@quiz/auth', () => ({ validateBrandOrThrow: vi.fn() }));
vi.mock('@quiz/auth/rbac/ownership.service', () => ({ OwnershipRBACService: { requirePermissionOrOwnership: vi.fn() } }));
vi.mock('@/modules/auth/brand-db', () => ({ getAuthBrandContext: () => ({
  tables: { userProfiles: { userId: 'user_id' } },
  db: { query: { userProfiles: { findFirst: mocks.findFirst } }, update: mocks.update, insert: mocks.insert },
}) }));
import { PATCH, POST } from '../route';

// Unit coverage of the owning handler's persistence projection. Runtime identity and
// cross-user behavior are separately exercised by authenticated-http.cjs.
describe('profile persistence ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'owner-a', brand: 'skillup', roles: ['student'], correlationId: 'fixture' });
    mocks.findFirst.mockResolvedValue({ userId: 'owner-a', name: 'A' });
    mocks.set.mockImplementation(data => ({ where: () => ({ returning: async () => [{ userId: 'owner-a', ...data }] }) }));
    mocks.update.mockReturnValue({ set: mocks.set });
  });
  it.each([PATCH, POST])('discards identity, ownership and database fields on the existing update aliases', async handler => {
    const request = new NextRequest('http://localhost/api/auth/profile', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Allowed A update', userId: 'owner-b', id: 'foreign-profile', tenantId: 'realtutorialhub', createdAt: '2000-01-01', deletedAt: '2000-01-01' }),
    });
    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(mocks.set).toHaveBeenCalledWith({ name: 'Allowed A update', updatedAt: expect.any(Date) });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('rejects malformed mutable fields before database mutation', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/auth/profile', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: { userId: 'owner-b' } }),
    }));
    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
