import { NextRequest, NextResponse } from 'next/server';
import { expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ reads: 0, platform: 'realtutorialhub', writes: vi.fn(), event: vi.fn() }));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'inert-fixture') } }));
vi.mock('drizzle-orm', () => ({ and: vi.fn(), desc: vi.fn(), eq: vi.fn(), isNull: vi.fn(), sql: vi.fn() }));
vi.mock('@quiz/events', () => ({ PlatformEventTypes: { ADMISSION_COMPLETED: 'fixture' }, publishEvent: f.event }));
vi.mock('@/lib/admin-bff', () => ({ requireAdminOrForbidden: async () => null, jsonError: (error: string, status: number) => NextResponse.json({ error }, { status }), jsonData: (data: unknown, status: number) => NextResponse.json(data, { status }) }));
vi.mock('@/lib/skillup-admin-data', () => ({ getAdminEnquiryDetail: async () => ({ email: 'same@example.test', studentName: 'Fixture' }) }));
vi.mock('@quiz/db-people', () => {
  const columns = new Proxy({}, { get: () => ({}) });
  const query = { from: () => query, where: () => query, orderBy: () => query, limit: async () => ++f.reads === 1 ? [{ id: 'batch' }] : [{ id: 'foreign-user', platform: f.platform }] };
  const insert = () => { f.writes(); return { values: () => ({ onConflictDoNothing: async () => undefined }) }; };
  return { db: { select: () => query, insert, transaction: async () => { f.writes(); } }, admissions: columns, batchEnrollments: columns, batches: columns, enquiries: columns, userProfiles: columns, users: columns };
});
import { POST } from '../route';
it('does not admit a foreign-platform email match', async () => {
  const response = await POST(new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }), { params: Promise.resolve({ id: 'e' }) });
  expect.soft(response.ok).toBe(false);
  expect.soft(f.writes).not.toHaveBeenCalled(); expect.soft(f.event).not.toHaveBeenCalled();
});

it('admits an existing same-platform fixture through the same adapter', async () => {
  f.reads = 0; f.writes.mockClear(); f.event.mockReset().mockResolvedValue({}); f.platform = 'skillup';
  const response = await POST(new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }), { params: Promise.resolve({ id: 'e' }) });
  expect(response.ok).toBe(true);
  expect(f.writes).toHaveBeenCalled();
});
