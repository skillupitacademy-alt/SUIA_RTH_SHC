import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/lib/student-auth', () => ({ requireStudentAuth: f.auth }));
import { GET } from '../route';
const id = '11111111-1111-4111-8111-111111111111';
const req = (subtopic = id) => new Request(`https://fixture.invalid/?subtopicId=${subtopic}`) as Parameters<typeof GET>[0];
const ctx = (nodeId: string) => ({ params: Promise.resolve({ nodeId }) });
beforeEach(() => { f.auth.mockReset().mockResolvedValue({ ok: true, userId: 'fixture' }); vi.stubGlobal('fetch', vi.fn()); });
it('forwards an ordinary slug and preserves data', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ progress: 1 }), { status: 200 }));
  const response = await GET(req(), ctx('what-is-java'));
  expect(await response.json()).toEqual({ progress: 1 });
  expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/navigation/what-is-java?');
});
it('encodes a node as a single path segment', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));
  await GET(req(), ctx('a/b?c'));
  expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/navigation/a%2Fb%3Fc?');
});
it('rejects invalid inputs and auth before fetching', async () => {
  expect((await GET(req('invalid'), ctx('node'))).status).toBe(400);
  expect((await GET(req(), ctx(''))).status).toBe(400);
  expect((await GET(req(), ctx('x'.repeat(201)))).status).toBe(400);
  f.auth.mockResolvedValue({ ok: false, response: new Response(null, { status: 401 }) });
  expect((await GET(req(), ctx('node'))).status).toBe(401);
  expect(fetch).not.toHaveBeenCalled();
});
it('sanitizes upstream and transport errors', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response('{"error":"sensitive"}', { status: 503 })).mockRejectedValueOnce(new Error('sensitive'));
  const upstream = await GET(req(), ctx('node'));
  expect(upstream.status).toBe(503); expect(await upstream.text()).not.toContain('sensitive');
  const failure = await GET(req(), ctx('node'));
  expect(failure.status).toBe(500); expect(await failure.text()).not.toContain('sensitive');
});
