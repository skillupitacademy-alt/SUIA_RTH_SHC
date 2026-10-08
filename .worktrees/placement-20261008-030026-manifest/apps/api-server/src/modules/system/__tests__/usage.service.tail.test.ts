import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UsageService } from '../usage.service';

vi.mock('resend', () => {
  class ResendMock {
    apiKeys = { list: vi.fn().mockRejectedValue(new Error('boom')) };
  }
  return { Resend: ResendMock };
});

describe('UsageService resend error branch', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv, RESEND_API_KEY: 'test-key' };
  });

  it('returns _error when Resend API call fails (lines 159-174)', async () => {
    const res = await (UsageService as any).getResendStatus();
    expect(res.status).toBe('_error');
    expect(res.configured).toBe(true);
    expect(res._error?.message).toBe('boom');
  });
});
