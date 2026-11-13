import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/lib/student-auth', () => ({ requireStudentAuth: f.auth }));
import { GET } from '../route';
const id = '11111111-1111-4111-8111-111111111111';
const request = new Request('https://fixture.invalid/progress') as Parameters<typeof GET>[0];
const context = (subtopicId: string) => ({ params: Promise.resolve({ subtopicId }) });
beforeEach(() => { f.auth.mockReset().mockResolvedValue({ ok: true, learnerUserId: '11111111-1111-4111-8111-111111111111', peoplePersonId: '22222222-2222-4222-8222-222222222222' }); vi.stubGlobal('fetch', vi.fn()); });
it('forwards a valid ID and returns successful progress', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ progress: [] }), { status: 200 }));
  const response = await GET(request, context(id));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ progress: [] });
  expect(vi.mocked(fetch).mock.calls[0][0]).toContain(`/subtopic/${id}/progress`);
});
it('rejects malformed ID and authentication before upstream', async () => {
  expect((await GET(request, context('../other'))).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
  f.auth.mockResolvedValue({ ok: false, response: new Response(null, { status: 401 }) });
  expect((await GET(request, context(id))).status).toBe(401);
  expect(fetch).not.toHaveBeenCalled();
});
it('sanitizes upstream and transport failures', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'sensitive-upstream' }), { status: 503 })).mockRejectedValueOnce(new Error('sensitive-transport'));
  const upstream = await GET(request, context(id));
  expect(upstream.status).toBe(503);
  expect(await upstream.text()).not.toContain('sensitive-upstream');
  const failure = await GET(request, context(id));
  expect(failure.status).toBe(500);
  expect(await failure.text()).not.toContain('sensitive-transport');
});
