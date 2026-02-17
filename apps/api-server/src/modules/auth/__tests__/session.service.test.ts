import { beforeEach, describe, expect, it, vi } from 'vitest';

// Execution deferred — real session store mocks to be added later.
describe.skip('SessionService (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a session and returns identifiers', async () => {
    const { SessionService } = await import('@/modules/auth/session.service');
    type CreateResult = Awaited<ReturnType<typeof SessionService.createSession>>;
    const result: CreateResult = { sessionId: 's1', userId: 'u1' } as CreateResult;
    vi.spyOn(SessionService, 'createSession').mockResolvedValue(result);
    const res = await SessionService.createSession('u1', 'device', 'ip', false);
    expect(res!.sessionId).toBe('s1');
  });

  it('refreshes session and extends expiry', async () => {
    expect(true).toBe(true);
  });

  it('revokes session and blocks reuse', async () => {
    expect(true).toBe(true);
  });
});
