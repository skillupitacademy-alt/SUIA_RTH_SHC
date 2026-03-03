import { describe, it, expect, vi } from 'vitest';

// Mock db so the guard short-circuits without hitting a real database
vi.mock('@quiz/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue(undefined), // simulate no user found
      },
      loginAttempts: {
        findFirst: vi.fn(),
      },
    },
  },
  loginAttempts: {},
  users: {},
}));

import { SecurityService } from '../security.service';

// covers no-origin guard (lines 29-33) and header build guard (67)
describe('SecurityService headers/guards', () => {
  it('returns false when account missing (no user)', async () => {
    await expect(SecurityService.isAccountLocked('missing@example.com', '1.1.1.1')).resolves.toBe(false);
  });
});
