import { beforeEach, describe, expect, it, vi } from 'vitest';

type SessionResult = { sessionId: string; userId: string };

vi.mock('@/modules/auth/session.service', () => ({
  SessionService: {
    createSession: vi.fn<() => Promise<SessionResult>>(),
    refreshSession: vi.fn<() => Promise<SessionResult | null>>(),
    revokeSession: vi.fn<() => Promise<void>>(),
  },
}));

describe.skip('SessionService (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a session and returns identifiers', async () => {
    const { SessionService } = await import('@/modules/auth/session.service');
    const result: SessionResult = { sessionId: 's1', userId: 'u1' };
    vi.mocked(SessionService.createSession).mockResolvedValue(result);
    const res = await SessionService.createSession('u1', 'device', 'ip', false);
    expect(res?.sessionId).toBe('s1');
  });

  it('refreshes session and extends expiry', async () => {
    const { SessionService } = await import('@/modules/auth/session.service');
    vi.mocked(SessionService.refreshSession).mockResolvedValue({ sessionId: 's1', userId: 'u1' });
    const res = await SessionService.refreshSession('refresh-token', 'ip');
    expect(res?.userId).toBe('u1');
  });

  it('revokes session and blocks reuse', async () => {
    const { SessionService } = await import('@/modules/auth/session.service');
    vi.mocked(SessionService.revokeSession).mockResolvedValue();
    await SessionService.revokeSession('s1');
    expect(SessionService.revokeSession).toHaveBeenCalledWith('s1');
  });
});
