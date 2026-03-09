import { describe, it, vi, expect, beforeEach } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  // Force addBreadcrumb to throw so we exercise the catch block in emit()
  addBreadcrumb: vi.fn(() => {
    throw new Error('breadcrumb failure');
  }),
}));

import { recordCounter } from '../metrics';

describe('metrics emit catch path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('swallows errors from Sentry export and logs fallback', () => {
    // Should not throw even though addBreadcrumb fails
    expect(() => recordCounter('test.metric', 2, { userId: 'u1' })).not.toThrow();
  });
});
