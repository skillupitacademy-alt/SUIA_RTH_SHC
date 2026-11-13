import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
const h = vi.hoisted(() => ({ where: vi.fn(), set: vi.fn(), transaction: vi.fn(), reserve: vi.fn(), release: vi.fn() }));
vi.mock('@quiz/db-people', async () => {
  const schema = await import('../../../../../../../../packages/db-people/src/schema');
  return { ...schema, db: { select: () => ({ from: () => ({ where: h.where }) }), transaction: h.transaction }, batchCapacityService: { reserveSlot: h.reserve, releaseSlot: h.release } };
});
vi.mock('@/lib/skillup-admin-data', () => ({
  listAdminStudents: vi.fn(),
  getAdminStudentDetail: vi.fn(async () => ({ userId: '11111111-1111-4111-8111-111111111111', batchId: 'batch-fixture', enquiryId: null })),
}));
vi.mock('@/lib/admin-bff', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin-bff')>('@/lib/admin-bff');
  return { ...actual, requireAdminOrForbidden: vi.fn(async () => null) };
});
vi.mock('@/lib/student-invitation', () => ({ normalizeStudentEmail: (email: string) => email.trim().toLowerCase(), generateRandomBootstrapPasswordHash: vi.fn(), issueStudentInvitationInDb: vi.fn(), runInInvitationTransaction: vi.fn() }));
vi.mock('@quiz/events', () => ({ PlatformEventTypes: {}, publishEvent: vi.fn() }));
import { POST } from '../route';
import { PATCH } from '../[id]/route';
import { NextRequest } from 'next/server';

beforeEach(() => vi.resetAllMocks());
describe('existing PeopleDB student email normalization', () => {
  it('finds a same-platform normalized duplicate before invitation or account writes', async () => {
    h.where.mockReturnValue({ limit: async () => [{ id: 'existing-fixture' }] });
    const response = await POST(new NextRequest('http://skillup.localhost:3010/api/admin/students', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Fixture', email: ' Learner@Example.test ', batchId: 'batch-fixture', batchName: 'Fixture' }) }));
    expect(response.status).toBe(409);
    const clause = new PgDialect().sqlToQuery(h.where.mock.calls[0][0] as SQL);
    expect(clause.sql).toContain('lower(trim(');
    expect(clause.params).toEqual(['learner@example.test', 'skillup']);
    expect(h.transaction).not.toHaveBeenCalled();
  });
  it('normalizes an existing UUID-scoped email update while testing only the initial update boundary', async () => {
    h.transaction.mockImplementation(async callback => callback({ update: () => ({ set: h.set }) }));
    h.set.mockReturnValue({ where: async () => { throw new Error('controlled stop before operational dependencies'); } });
    await PATCH(new NextRequest('http://skillup.localhost:3010/api/admin/students/fixture', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Fixture', email: ' Learner@Example.test ', batchId: 'batch-fixture' }) }), { params: Promise.resolve({ id: 'fixture' }) });
    expect(h.set).toHaveBeenCalledWith(expect.objectContaining({ email: 'learner@example.test' }));
    expect(h.reserve).not.toHaveBeenCalled();
  });
});
