import { expect, it, vi } from 'vitest';
vi.mock('@quiz/db', () => ({ withTimeout: (p: Promise<unknown>) => p, STANDARD_QUERY_TIMEOUT: 1000, REPORT_QUERY_TIMEOUT: 1000 }));
vi.mock('../../db', () => ({ db: {} }));
import { TutorialProgressRepository } from '../tutorial-progress.repository';
function fixture() {
  let row: any = { id: 'fixture', userId: 'user', subtopicId: 'topic', blocksCompleted: ['notes'], status: 'in_progress', completedAt: null, deletedAt: null, version: 1 };
  const db = {
    select: () => ({ from: () => ({ where: async () => [{ ...row, blocksCompleted: [...row.blocksCompleted] }] }) }),
    update: () => ({ set: (values: any) => ({ where: () => ({ returning: async () => { row = { ...row, ...values }; return [row]; } }) }) }),
  };
  return { repo: new TutorialProgressRepository(db as never), row: () => row };
}
it('retains sequential distinct completions', async () => {
  const f = fixture();
  await f.repo.markBlockComplete('user', 'topic', 'technical');
  await f.repo.markBlockComplete('user', 'topic', 'code');
  expect(f.row().blocksCompleted).toEqual(expect.arrayContaining(['technical', 'code']));
});
it('retains distinct concurrent completions', async () => {
  const f = fixture();
  await Promise.all([f.repo.markBlockComplete('user', 'topic', 'technical'), f.repo.markBlockComplete('user', 'topic', 'code')]);
  expect(f.row().blocksCompleted).toEqual(expect.arrayContaining(['technical', 'code']));
});
