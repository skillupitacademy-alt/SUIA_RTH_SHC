import { describe, expect, it } from 'vitest';

import { PasswordService } from '../password.service';

describe('PasswordService', () => {
  it('hashes and compares passwords', async () => {
    const service = new PasswordService();
    const hash = await service.hash('Password123!');

    expect(hash).not.toBe('Password123!');
    await expect(service.compare('Password123!', hash)).resolves.toBe(true);
    await expect(service.compare('WrongPassword!', hash)).resolves.toBe(false);
  });

  it('rejects short passwords', async () => {
    const service = new PasswordService();
    await expect(service.hash('short')).rejects.toThrow('Password must be at least 8 characters long');
  });
});
