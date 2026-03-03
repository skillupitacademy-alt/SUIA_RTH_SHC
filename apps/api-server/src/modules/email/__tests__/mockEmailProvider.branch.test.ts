import { describe, it, expect } from 'vitest';
import { MockEmailProvider } from '../providers/MockEmailProvider';

// Covers MockEmailProvider no-op branches (line 6)
describe('MockEmailProvider', () => {
  it('resolves sendEmail without throwing', async () => {
    const provider = new MockEmailProvider();
    await expect(provider.sendEmail({ to: 'a@b.com', subject: 'hi', text: 'x' })).resolves.toBeUndefined();
  });

  it('resolves sendPasswordReset without throwing', async () => {
    const provider = new MockEmailProvider();
    await expect(provider.sendPasswordReset('user@test.com', 'https://example.com/reset')).resolves.toBeUndefined();
  });
});

