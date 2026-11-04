import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { ExportSaga } from '@/lib/export/export.saga';
import { POST } from '../route';

vi.mock('@/lib/export/export.saga', () => ({ ExportSaga: { start: vi.fn(async () => 'job-test') } }));

const secret = new TextEncoder().encode('isolated-trigger-test-key-32bytes!');
const tokens = new TokenService(secret, secret, secret);
const previous = container.get(TokenService);
const previousQueue = process.env.QUEUE_ENABLED;

async function request(userId: string, brand: 'skillup' | 'realtutorialhub', forgedUserId = 'forged') {
  const token = await tokens.generateAccessToken({ userId, originalUserId: userId, shadowUserId: userId,
    email: 'learner@example.test', roles: ['student'], brand, tokenType: 'user', aud: 'user' });
  return new NextRequest('http://localhost/api/export/trigger', { method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-user-id': forgedUserId },
    body: JSON.stringify({ examId: 'private-exam', format: 'json', userId: forgedUserId }) });
}

// Intended resource fixture: private-exam belongs to skillup/owner. The handler has
// no exam repository dependency, so this policy is an asserted requirement, not seeded DB evidence.
describe('export trigger resource authority (isolated saga boundary)', () => {
  beforeEach(() => { container.register(TokenService, tokens); process.env.QUEUE_ENABLED = 'true'; vi.clearAllMocks(); });
  afterEach(() => { container.register(TokenService, previous); if (previousQueue === undefined) delete process.env.QUEUE_ENABLED; else process.env.QUEUE_ENABLED = previousQueue; });
  it('dispatches the signed owner and ignores forged subject metadata', async () => {
    const response = await POST(await request('owner', 'skillup'));
    expect(response.status).toBe(200);
    expect(ExportSaga.start).toHaveBeenCalledExactlyOnceWith('private-exam', 'owner', 'json');
  });
  it('denies another learner before job dispatch', async () => {
    const response = await POST(await request('non-owner', 'skillup'));
    expect.soft(response.status).toBe(403);
    expect(ExportSaga.start).not.toHaveBeenCalled();
  });
  it('denies the foreign tenant with an equal local subject before job dispatch', async () => {
    const response = await POST(await request('owner', 'realtutorialhub'));
    expect.soft(response.status).toBe(403);
    expect(ExportSaga.start).not.toHaveBeenCalled();
  });
});
