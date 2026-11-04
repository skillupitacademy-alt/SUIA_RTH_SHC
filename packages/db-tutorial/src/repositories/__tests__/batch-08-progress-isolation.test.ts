import { describe, expect, it, vi } from 'vitest';

import { TutorialProgressRepository } from '../tutorial-progress.repository';

// The real repository receives only local userId/subtopicId. The adapter deliberately
// offers a shared store with a colliding subject; it does not enforce tenant isolation.
function fixture() {
  let row = { id: 'progress-a', userId: 'same-local-id', subtopicId: 'same-content', blocksCompleted: ['concept'], status: 'in_progress', completedAt: null, deletedAt: null };
  const selectWhere = vi.fn(async () => [row]);
  const updateWhere = vi.fn(() => ({ returning: async () => { row = { ...row, blocksCompleted: ['concept', 'example'] }; return [row]; } }));
  const db = {
    select: () => ({ from: () => ({ where: selectWhere }) }),
    update: () => ({ set: () => ({ where: updateWhere }) }),
  };
  return { repo: new TutorialProgressRepository(db as never), selectWhere, updateWhere, current: () => row };
}

describe('B08-T08 actual progress repository tenant collision', () => {
  it('owner control reads the stored marker', async () => {
    const f = fixture();
    expect((await f.repo.getProgress('same-local-id', 'same-content'))?.blocksCompleted).toEqual(['concept']);
    expect(f.selectWhere).toHaveBeenCalledOnce();
  });
  it('foreign tenant with equal local IDs must not read the owner marker', async () => {
    const f = fixture();
    // There is no tenant parameter to supply; this required denial exposes the gap.
    expect(await f.repo.getProgress('same-local-id', 'same-content')).toBeUndefined();
  });
  it('foreign tenant with equal local IDs must not alter the owner marker', async () => {
    const f = fixture();
    await f.repo.markBlockComplete('same-local-id', 'same-content', 'example');
    expect(f.current().blocksCompleted).toEqual(['concept']);
    expect(f.updateWhere).not.toHaveBeenCalled();
  });
});
