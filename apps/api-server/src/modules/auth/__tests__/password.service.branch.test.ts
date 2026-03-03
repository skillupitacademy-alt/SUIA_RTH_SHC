import { describe, it, expect } from 'vitest';

import { PasswordService } from '../password.service';

describe('PasswordService guard branch', () => {
  it('hash/compare handles empty string', async () => {
    const hashed = await PasswordService.hash('');
    const matches = await PasswordService.compare('', hashed);
    expect(matches).toBe(true);
  });
});
