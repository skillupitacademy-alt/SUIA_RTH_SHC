import { NextRequest, NextResponse } from 'next/server';
import { expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ reads: 0, platform: 'realtutorialhub', writes: vi.fn(), insert: vi.fn(), event: vi.fn() }));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'inert-fixture') } }));
vi.mock('drizzle-orm', () => ({ and: vi.fn(), desc: vi.fn(), eq: vi.fn(), isNull: vi.fn(), sql: vi.fn() }));
vi.mock('@quiz/events', () => ({ PlatformEventTypes: { ADMISSION_COMPLETED: 'fixture' }, publishEvent: f.event }));
vi.mock('@/lib/admin-bff', () => ({ requireAdminOrForbidden: async () => null, jsonError: (error: string, status: number) => NextResponse.json({ error }, { status }), jsonData: (data: unknown, status: number) => NextResponse.json(data, { status }) }));
vi.mock('@/lib/skillup-admin-data', () => ({ getAdminEnquiryDetail: async () => ({ email: 'same@example.test', studentName: 'Fixture' }) }));
vi.mock('@quiz/db-people', () => {
  const columns = new Proxy({}, { get: () => ({}) });
  const query = {
    from: () => query,
    where: () => query,
    orderBy: () => query,
    limit: async () => {
      // First read: batch lookup (always returns batch)
      if (f.reads === 0) { f.reads++; return [{ id: 'batch' }]; }
      // Second read: platform-scoped user lookup
      // Return user only if platforms match, otherwise return empty (no same-platform match)
      f.reads++;
      return f.platform === 'skillup' ? [{ id: 'existing-user' }] : [];
    }
  };
  const insert = () => {
    f.insert();
    return {
      values: () => ({
        onConflictDoNothing: async () => undefined,
        returning: () => ({ then: async (fn: any) => fn([{ id: 'new-user' }]) })
      })
    };
  };
  return {
    db: { select: () => query, insert, transaction: async (fn: any) => { f.writes(); await fn({ select: () => query, insert, update: () => ({ set: () => ({ where: async () => undefined }) }) }); } },
    admissions: columns, batchEnrollments: columns, batches: columns, enquiries: columns, userProfiles: columns, users: columns
  };
});
import { POST } from '../route';

it('rejects foreign-platform email collision (Option B: reject collision)', async () => {
  f.reads = 0; f.platform = 'realtutorialhub'; f.insert.mockClear(); f.writes.mockClear(); f.event.mockReset().mockResolvedValue({});
  const response = await POST(new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }), { params: Promise.resolve({ id: 'e' }) });
  expect.soft(response.ok).toBe(false);
  expect.soft(response.status).toBe(409);
  expect.soft(f.writes).not.toHaveBeenCalled(); // No admission created
  expect.soft(f.event).not.toHaveBeenCalled(); // No event published
});

it('admits when email exists on same platform (reuses user)', async () => {
  f.reads = 0; f.platform = 'skillup'; f.insert.mockClear(); f.writes.mockClear(); f.event.mockReset().mockResolvedValue({});
  const response = await POST(new NextRequest('http://localhost/api/admin/crm/enquiries/e/admit', { method: 'POST' }), { params: Promise.resolve({ id: 'e' }) });
  expect.soft(response.ok).toBe(true);
  expect.soft(f.writes).toHaveBeenCalled(); // Transaction completed
  expect.soft(f.event).toHaveBeenCalled(); // Event published
});
