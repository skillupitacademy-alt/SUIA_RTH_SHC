import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockCount, mockDistribution, mockGauge, mockAddBreadcrumb } = vi.hoisted(() => ({
  mockCount: vi.fn(),
  mockDistribution: vi.fn(),
  mockGauge: vi.fn(),
  mockAddBreadcrumb: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: mockAddBreadcrumb,
  metrics: {
    count: mockCount,
    distribution: mockDistribution,
    gauge: mockGauge,
  },
}));

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import * as Sentry from '@sentry/nextjs';
import { recordCounter, recordTimer } from '@/lib/metrics';

describe('metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls Sentry.metrics.count() for counters with attributes', () => {
    recordCounter('api.requests', 1, { route: '/login', outcome: 'success' });

    expect(mockCount).toHaveBeenCalledWith(
      'api.requests',
      1,
      { attributes: { route: '/login', outcome: 'success' } },
    );
    // Breadcrumb should NOT be called when metrics API is present
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it('calls Sentry.metrics.distribution() for non-1 values', () => {
    recordCounter('api.payload_size', 4096, { route: '/upload' });

    expect(mockDistribution).toHaveBeenCalledWith(
      'api.payload_size',
      4096,
      { attributes: { route: '/upload' }, unit: 'none' },
    );
  });

  it('calls Sentry.metrics.distribution() for timers', () => {
    recordTimer('api.latency', 250, { route: '/dashboard' });

    expect(mockDistribution).toHaveBeenCalledWith(
      'api.latency.ms',
      250,
      { attributes: { route: '/dashboard' }, unit: 'none' },
    );
  });

  it('scrubs tags and falls back to breadcrumbs when metrics API is absent', () => {
    (Sentry as any).metrics = undefined;

    recordCounter('core.test', 1, {
      examId: 'e1',
      optional: undefined,
      nullable: null,
      retries: 2,
      email: 'user@example.com',
    });

    expect(mockAddBreadcrumb).toHaveBeenCalled();
    const lastCall = (mockAddBreadcrumb as any).mock.calls.at(-1)[0];
    expect(lastCall.data.examId).toBe('[redacted]');
    expect(lastCall.data.retries).toBe('2');

    // Restore for other tests
    (Sentry as any).metrics = { count: mockCount, distribution: mockDistribution, gauge: mockGauge };
  });

  it('emits dotted and non-dotted metric variants', () => {
    recordCounter('core.test', 1);
    recordCounter('core_test', 2);
    recordTimer('core.test', 5);
    recordTimer('core_test', 6);

    // core.test (count=1) → count x1 + core_test (count=1) → count x1 = 2 count calls
    // core_test (value=2) → distribution x1
    expect(mockCount).toHaveBeenCalledTimes(2);
    // core_test (val=2) x1 + core.test.ms x1 + core_test_ms x1 + core_test.ms x1 = 4
    expect(mockDistribution).toHaveBeenCalledTimes(4);
  });
});
