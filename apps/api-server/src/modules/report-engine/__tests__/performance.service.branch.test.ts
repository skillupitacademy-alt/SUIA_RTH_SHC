import { vi, describe, it, expect, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    execute: vi.fn(),
    logInfo: vi.fn(),
    logError: vi.fn(),
  };
});

vi.mock('@quiz/db', () => ({ db: { execute: (...args: any[]) => mocks.execute(...args) } }));
vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ info: mocks.logInfo, error: mocks.logError, warn: vi.fn() }) },
}));

describe('PerformanceService refreshAnalytics branches', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.execute.mockReset();
    mocks.logInfo.mockReset();
    mocks.logError.mockReset();
  });

  it('logs info on successful materialized view refresh', async () => {
    mocks.execute.mockResolvedValue(undefined);

    const { PerformanceService } = await import('../performance.service');

    await PerformanceService.refreshAnalytics();

    expect(mocks.execute).toHaveBeenCalledTimes(2);
    expect(mocks.logInfo).toHaveBeenCalledWith('Materialized views refreshed successfully.');
    expect(mocks.logError).not.toHaveBeenCalled();
  });

  it('logs error when refresh throws', async () => {
    mocks.execute.mockRejectedValue(new Error('db down'));

    const { PerformanceService } = await import('../performance.service');

    await PerformanceService.refreshAnalytics();

    expect(mocks.logError).toHaveBeenCalledWith({ err: expect.any(Error) }, 'Materialized view refresh failed completely');
  });
});
