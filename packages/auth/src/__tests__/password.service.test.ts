import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PasswordService } from '../password.service';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe('PasswordService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hashes passwords', async () => {
    const service = new PasswordService();
    await expect(service.hash('secret')).resolves.toBe('hashed');
  });

  it('compares passwords', async () => {
    const service = new PasswordService();
    await expect(service.compare('secret', 'hashed')).resolves.toBe(true);
  });
});
