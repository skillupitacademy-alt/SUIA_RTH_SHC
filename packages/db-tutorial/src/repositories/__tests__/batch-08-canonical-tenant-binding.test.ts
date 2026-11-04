import { describe, expect, it, vi } from 'vitest';
import { TutorialNavigationProgressRepository } from '../tutorial-navigation-progress.repository';

vi.mock('@quiz/db', () => ({ withTimeout: (promise: Promise<unknown>) => promise, STANDARD_QUERY_TIMEOUT: 15000, REPORT_QUERY_TIMEOUT: 30000 }));

describe('canonical navigation progress tenant binding', () => {
  it('cannot distinguish equal local subject and node across independent tenants with a shared store', async () => {
    // One shared adapter models the configured tutorial database; the repository API has no tenant input.
    const row = { userId: 'local-1', navigationNodeId: 'node-1', privateMarker: 'skillup-private' };
    const where = vi.fn(async () => [row]);
    const db = { select: () => ({ from: () => ({ where }) }) };
    const repository = new TutorialNavigationProgressRepository(db as never);
    const skillup = await repository.getProgress('local-1', 'node-1');
    const realtutorialhub = await repository.getProgress('local-1', 'node-1');
    expect(skillup).toEqual(row);
    expect(where).toHaveBeenCalledTimes(2);
    // Desired invariant: the independent RTH principal cannot read the SUIA row.
    expect(realtutorialhub).toBeUndefined();
  });
});
