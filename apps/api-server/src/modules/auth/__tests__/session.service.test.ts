import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from '../session.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => {
    const mockDb = {
        insert: vi.fn().mockImplementation((_table: any) => ({
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 's1' }])
        })),
        update: vi.fn().mockImplementation((_table: any) => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'id' }])
        })),
        delete: vi.fn().mockImplementation((_table: any) => ({
            where: vi.fn().mockReturnThis()
        })),
    };
    return {
        db: mockDb,
        sessions: { tableName: 'sessions', userId: 'u', ip: 'ip', device: 'd', expiresAt: 'e' },
        refreshTokens: { tableName: 'refresh_tokens', userId: 'u', revoked: 'r' },
    };
});

describe('SessionService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    container.reset();
    const { db } = await import('@quiz/db');
    container.register(SessionService, new SessionService(db as any));
  });

  it('creates a session', async () => {
    const service = container.get(SessionService);
    const { sessions } = await import('@quiz/db');
    const result = await service.createSession('u1', '1.1.1.1', 'mobile');
    expect(result[0].id).toBe('s1');
  });

  it('revokes refresh tokens', async () => {
    const service = container.get(SessionService);
    await service.revokeRefreshTokens('u1');
    const { db } = await import('@quiz/db');
    expect(db.update).toHaveBeenCalled();
  });

  it('cleans expired sessions', async () => {
    const service = container.get(SessionService);
    await service.cleanExpiredSessions();
    const { db } = await import('@quiz/db');
    expect(db.delete).toHaveBeenCalled();
  });
});


