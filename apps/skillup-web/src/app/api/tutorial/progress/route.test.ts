import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { requireStudentAuth } from '@/lib/student-auth';

vi.mock('@/lib/student-auth', () => ({ requireStudentAuth: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

it.each(['http://localhost:3000', 'http://localhost:3000/api', 'http://localhost:3000/api/'])(
  'normalizes the progress upstream and forwards internal authentication: %s', async base => {
    vi.stubEnv('INTERNAL_API_URL', base);
    vi.stubEnv('INTERNAL_API_KEY', 'test-internal-key');
    vi.mocked(requireStudentAuth).mockResolvedValue({ ok: true, userId: 'learner', payload: {} as never });
    const upstream = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ data: {} }), { status: 200 }));
    vi.stubGlobal('fetch', upstream);
    const id = '11111111-1111-4111-8111-111111111111';
    expect((await GET(new NextRequest(`http://skillup.localhost/api/tutorial/progress?subtopicId=${id}`))).status).toBe(200);
    expect(upstream).toHaveBeenLastCalledWith(`http://localhost:3000/api/tutorial/progress?subtopicId=${id}`,
      expect.objectContaining({ headers: expect.objectContaining({ 'x-internal-key': 'test-internal-key' }) }));
    const response = await POST(new NextRequest('http://skillup.localhost/api/tutorial/progress', {
      method: 'POST', body: JSON.stringify({ subtopicId: id, blockType: 'code', status: 'viewed' }),
    }));
    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenLastCalledWith('http://localhost:3000/api/tutorial/progress', expect.objectContaining({ method: 'POST' }));
  });

it('never proxies unauthenticated progress requests', async () => {
  vi.mocked(requireStudentAuth).mockResolvedValue({ ok: false, response: new Response(null, { status: 401 }) as never });
  const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
  expect((await GET(new NextRequest('http://skillup.localhost/api/tutorial/progress'))).status).toBe(401);
  expect(upstream).not.toHaveBeenCalled();
});

it('forwards the exact access and refresh cookie pair with CSRF proof', async () => {
  vi.stubEnv('INTERNAL_API_URL', 'http://localhost:3000');
  vi.mocked(requireStudentAuth).mockResolvedValue({ ok: true, userId: 'learner', payload: {} as never });
  const upstream = vi.fn().mockResolvedValue(Response.json({ data: {} }));
  vi.stubGlobal('fetch', upstream);
  const request = new NextRequest('http://skillup.localhost/api/tutorial/progress?subtopicId=11111111-1111-4111-8111-111111111111', {
    headers: { cookie: 'accessToken=device-access; refreshToken=device-refresh; csrfToken=device-csrf', 'x-csrf-token': 'device-csrf' },
  });
  expect((await GET(request)).status).toBe(200);
  expect(upstream).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    headers: expect.objectContaining({
      Authorization: 'Bearer device-access',
      Cookie: 'accessToken=device-access; refreshToken=device-refresh; csrfToken=device-csrf',
      'x-csrf-token': 'device-csrf',
    }),
  }));
});
