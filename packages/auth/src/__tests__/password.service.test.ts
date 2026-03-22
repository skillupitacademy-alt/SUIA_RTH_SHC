import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

import { PasswordService } from '../password.service';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed'),
    compare: vi.fn(),
  },
}));

describe('PasswordService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  it('hashes passwords', async () => {
    const service = new PasswordService();
    await expect(service.hash('secret')).resolves.toBe('hashed');
  });

  it('compares passwords', async () => {
    const service = new PasswordService();
    await expect(service.compare('secret', 'hashed')).resolves.toBe(true);
  });

  it('returns false for wrong password', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);
    const service = new PasswordService();
    await expect(service.compare('wrong', 'hashed')).resolves.toBe(false);
  });
});
