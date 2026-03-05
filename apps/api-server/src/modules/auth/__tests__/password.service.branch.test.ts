import { describe, it, expect } from 'vitest';

import { PasswordService } from '../password.service';

describe('PasswordService guard branch', () => {
  it('hash/compare handles empty string', async () => {
    const service = new PasswordService();
    const hashed = await service.hash('');
    const matches = await service.compare('', hashed);
    expect(matches).toBe(true);
  });
});
