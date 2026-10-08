import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

class ResendMock {
  apiKeys = {
    list: vi.fn().mockResolvedValue({ data: [{ id: 'key1' }] })
  };
}

vi.mock('resend', () => ({ Resend: ResendMock }));

describe('UsageService Resend success branch', () => {
  let UsageService: any;

  beforeEach(async () => {
    process.env.RESEND_API_KEY = 'test-key';
    UsageService = (await import('../usage.service')).UsageService;
    vi.spyOn(UsageService as any, 'withTimeout').mockImplementation((p: Promise<unknown>) => p);
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it('returns ok when Resend responds', async () => {
    const res = await (UsageService as any).getResendStatus();
    expect(res.status).toBe('ok');
    expect(res.configured).toBe(true);
    expect(res.metrics?.connected).toBe(true);
  });
});
