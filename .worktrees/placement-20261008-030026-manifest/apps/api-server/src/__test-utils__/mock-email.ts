import { vi } from 'vitest';

export const mockEmailProvider = {
  send: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-id' }),
};

vi.mock('@/modules/email/email.provider', () => ({
  emailProvider: mockEmailProvider,
}));
