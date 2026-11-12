// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn() }));
vi.mock('@quiz/auth', () => ({ TokenService: class { getAccessToken() { return 'synthetic-token'; } } }));
vi.mock('@/lib/assignment-auth', () => ({
  requireStudent: mocks.authenticate,
  AssignmentAuthError: class extends Error { constructor(message: string, public statusCode: number) { super(message); } },
}));
import { GET, POST } from '@/app/api/tutorial/progress/route';
import { POST as completeBlock } from '@/app/api/tutorial/ils/block-completion/route';
import { AssignmentAuthError } from '@/lib/assignment-auth';

const privateDetail = 'postgresql://private-user:private-password@private-host/database';
const subtopic = '11111111-1111-4111-8111-111111111111';
const cases = [
  { label: 'progress read', handler: GET, method: 'GET', path: `/api/tutorial/progress?subtopicId=${subtopic}` },
  { label: 'progress write', handler: POST, method: 'POST', path: '/api/tutorial/progress' },
  { label: 'block completion', handler: completeBlock, method: 'POST', path: '/api/tutorial/ils/block-completion' },
];
const request = (method: string, path: string) => new NextRequest(`https://user.realtutorialhub.com${path}`, {
  method, headers: { 'content-type': 'application/json', 'x-request-id': subtopic },
  ...(method === 'POST' ? { body: JSON.stringify({ subtopicId: subtopic, blockType: 'code', status: 'viewed' }) } : {}),
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.authenticate.mockResolvedValue({ userId: 'verified-rth-learner', brand: 'realtutorialhub' });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe.each(cases)('$label public errors', ({ handler, method, path }) => {
  it('redacts thrown provider details and correlates private diagnostics', async () => {
    const error = Object.assign(new Error(privateDetail), { code: '42703' });
    mocks.authenticate.mockRejectedValue(error);
    const response = await handler(request(method, path));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error', requestId: subtopic });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-request-id')).toBe(subtopic);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(privateDetail);
    expect(console.error).toHaveBeenCalledWith('BFF request failed', expect.objectContaining({ errorCode: '42703', requestId: subtopic }));
  });
  it.each([500, 503])('sanitizes upstream %s without changing its status', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: privateDetail }, { status })));
    const response = await handler(request(method, path));
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain(privateDetail);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it.each([401, 403])('preserves authentication status %s without forwarding', async status => {
    mocks.authenticate.mockRejectedValue(new AssignmentAuthError('Denied', status as 401 | 403));
    const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
    expect((await handler(request(method, path))).status).toBe(status);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('preserves an upstream conflict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Version conflict' }, { status: 409 })));
    expect((await handler(request(method, path))).status).toBe(409);
  });
});
