import { describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
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
  it('scrubs tags and falls back to breadcrumbs when metrics API is absent', () => {
    (Sentry as any).metrics = undefined;

    recordCounter('core.test', 1, {
      examId: 'e1',
      optional: undefined,
      nullable: null,
      retries: 2,
      email: 'user@example.com',
    });

    expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    const lastCall = (Sentry.addBreadcrumb as any).mock.calls.at(-1)[0];
    expect(lastCall.data.examId).toBe('[redacted]');
    expect(lastCall.data.retries).toBe('2');
  });

  it('emits dotted and non-dotted metric variants', () => {
    (Sentry as any).metrics = undefined;

    recordCounter('core.test', 1);
    recordCounter('core_test', 2);
    recordTimer('core.test', 5);
    recordTimer('core_test', 6);

    expect(Sentry.addBreadcrumb).toHaveBeenCalled();
  });
});
