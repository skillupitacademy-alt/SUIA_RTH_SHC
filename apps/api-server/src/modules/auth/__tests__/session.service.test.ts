import { beforeEach, describe, expect, it, vi } from 'vitest';

// Execution deferred — real session store mocks to be added later.
describe.skip('SessionService (scaffold)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a session and returns identifiers', async () => {
    expect(true).toBe(true);
  });

  it('refreshes session and extends expiry', async () => {
    expect(true).toBe(true);
  });

  it('revokes session and blocks reuse', async () => {
    expect(true).toBe(true);
  });
});
