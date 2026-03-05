import { describe, it, expect, vi } from 'vitest';
import { db, users } from '@quiz/db';
import { SecurityService } from '../security.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      loginAttempts: { findFirst: vi.fn() },
    },
  },
  users: { id: 'u', email: 'e' },
  loginAttempts: { id: 'la', userId: 'u', ip: 'ip' },
}));

describe('SecurityService Early Coverage', () => {
  it('isAccountLocked handles missing entries early', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
    container.reset();
    const service = container.get(SecurityService);
    const locked = await service.isAccountLocked('missing@example.com', '1.1.1.1');
    expect(locked).toBe(false);
  });
});
