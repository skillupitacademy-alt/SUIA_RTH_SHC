import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ values: vi.fn(), guard: vi.fn() }));
vi.mock('@/lib/admin-route-guard', () => ({ requireAdminRequest: fixture.guard }));
vi.mock('@quiz/db', () => ({
  domains: {},
  getDb: () => ({ insert: () => ({ values: fixture.values }) }),
}));
import { POST } from '../route';

function request(body: unknown) {
  return new Request('http://localhost/api/admin/domains', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0];
}

describe('SHC domain create ingress', () => {
  beforeEach(() => {
    fixture.guard.mockReset().mockResolvedValue(null);
    fixture.values.mockReset().mockReturnValue({ returning: async () => [{ id: 'fixture' }] });
  });
  it('accepts a valid fixture domain', async () => {
    expect((await POST(request({ name: 'Domain', category: 'technical' }))).status).toBe(201);
    expect(fixture.values).toHaveBeenCalledOnce();
  });
  it('rejects a numeric name before persistence', async () => {
    expect((await POST(request({ name: 42, category: 'technical' }))).status).toBe(400);
    expect(fixture.values).not.toHaveBeenCalled();
  });
});
