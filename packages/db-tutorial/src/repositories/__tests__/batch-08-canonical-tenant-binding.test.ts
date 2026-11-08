import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { TutorialNavigationProgressRepository } from '../tutorial-navigation-progress.repository';

vi.mock('@quiz/db', () => ({ withTimeout: (promise: Promise<unknown>) => promise, STANDARD_QUERY_TIMEOUT: 15000, REPORT_QUERY_TIMEOUT: 30000 }));
function repository(row: { userId: string; navigationNodeId: string; privateMarker: string }) {
  const where = vi.fn(async (clause: any) => {
    const params = new PgDialect().sqlToQuery(clause).params;
    return params.includes(row.userId) && params.includes(row.navigationNodeId) ? [row] : [];
  });
  return { repo: new TutorialNavigationProgressRepository({ select: () => ({ from: () => ({ where }) }) } as never), where };
}
describe('canonical navigation progress tenant binding', () => {
  it('isolated stores distinguish rows when the caller selects the correct adapter', async () => {
    const a = repository({ userId: 'local-1', navigationNodeId: 'node-1', privateMarker: 'A' });
    const b = repository({ userId: 'local-1', navigationNodeId: 'node-1', privateMarker: 'B' });
    expect((await a.repo.getProgress('local-1', 'node-1') as unknown as { privateMarker: string })?.privateMarker).toBe('A');
    expect((await b.repo.getProgress('local-1', 'node-1') as unknown as { privateMarker: string })?.privateMarker).toBe('B');
    expect(await a.repo.getProgress('other', 'node-1')).toBeUndefined();
  });
  it('cannot distinguish equal local subject and node when the shared adapter is selected', async () => {
    const a = repository({ userId: 'local-1', navigationNodeId: 'node-1', privateMarker: 'A' });
    expect((await a.repo.getProgress('local-1', 'node-1') as unknown as { privateMarker: string })?.privateMarker).toBe('A');
    const foreign = await a.repo.getProgress('local-1', 'node-1');
    expect(a.where).toHaveBeenCalledTimes(2);
    expect(foreign).toBeUndefined();
  });
});
