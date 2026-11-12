import { NextRequest } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { requireStudentAuth } from '@/lib/student-auth';
import { POST } from './route';

vi.mock('@/lib/student-auth', () => ({ requireStudentAuth: vi.fn() }));
const secretDetail = 'postgresql://private-user:private-password@private-host/database';
const request = () => new NextRequest('https://user.skillupitacademy.com/api/tutorial/ils/block-completion', {
  method: 'POST', body: '{}',
});
beforeEach(() => {
  vi.mocked(requireStudentAuth).mockResolvedValue({ ok: true, userId: 'synthetic-learner', payload: {} as never });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('keeps provider exception details out of responses and logs', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(secretDetail)));
  const response = await POST(request());
  expect(response.status).toBe(500);
  expect(await response.json()).toMatchObject({ error: 'Internal server error', requestId: expect.any(String) });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(secretDetail);
});
it.each([500, 503])('sanitizes upstream %s', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: secretDetail }, { status })));
  const response = await POST(request());
  expect(response.status).toBe(status);
  expect(await response.text()).not.toContain(secretDetail);
});
it.each([401, 403, 409])('preserves upstream %s', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Denied' }, { status })));
  expect((await POST(request())).status).toBe(status);
});
it('rejects unauthenticated completion before contacting upstream', async () => {
  vi.mocked(requireStudentAuth).mockResolvedValue({ ok: false, response: new Response(null, { status: 401 }) as never });
  const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
  expect((await POST(request())).status).toBe(401);
  expect(upstream).not.toHaveBeenCalled();
});
