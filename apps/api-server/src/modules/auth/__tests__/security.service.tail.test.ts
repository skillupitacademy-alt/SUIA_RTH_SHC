import { describe, it, expect, vi } from 'vitest';
import { db, loginAttempts, users } from '@quiz/db';
import { SecurityService } from '../security.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      loginAttempts: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn() }),
    delete: vi.fn().mockReturnValue({ where: vi.fn() }),
  },
  loginAttempts: { id: 'la', userId: 'u', ip: 'ip' },
  users: { id: 'u', email: 'e' },
}));

describe('SecurityService Tail Coverage', () => {
  it('isAccountLocked returns false for missing entries', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
    container.reset();
    const service = container.get(SecurityService);
    await expect(service.isAccountLocked('missing@example.com', '1.1.1.1')).resolves.toBe(false);
  });
});
