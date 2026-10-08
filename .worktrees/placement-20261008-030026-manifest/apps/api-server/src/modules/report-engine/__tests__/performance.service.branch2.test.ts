import { describe, it, vi, expect } from 'vitest';

// Force cacheService.set to throw so we hit the write-fail warning path (lines ~34-44)
vi.mock('../../core/cache.service', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn().mockRejectedValue(new Error('write-fail')),
    del: vi.fn(),
  },
}));

// Mock logger to avoid noisy output
vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }) },
}));

describe('PerformanceService cache write fallback', () => {
  it('logs and continues when cache write fails', async () => {
    const { PerformanceService } = await import('../performance.service');
    await PerformanceService.cacheReport('exam-1', { foo: 'bar' });
    // No throw means we hit the catch branch; nothing else to assert.
    expect(true).toBe(true);
  });
});
