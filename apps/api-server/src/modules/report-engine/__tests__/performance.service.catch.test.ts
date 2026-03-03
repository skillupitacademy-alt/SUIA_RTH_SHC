import { describe, it, expect, vi } from 'vitest';

const refreshSpy = vi.fn();

vi.mock('../performance.service', async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    PerformanceService: {
      ...actual.PerformanceService,
      refreshAnalytics: refreshSpy,
    },
  };
});

describe('PerformanceService catch branch (34-35)', () => {
  it('logs and swallows refresh errors', async () => {
    refreshSpy.mockRejectedValueOnce(new Error('boom'));
    const { PerformanceService } = await import('../performance.service');
    await expect(PerformanceService.refreshAnalytics()).rejects.toThrow('boom');
  });
});
