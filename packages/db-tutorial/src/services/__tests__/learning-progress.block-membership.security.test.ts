import { describe, expect, it, vi } from 'vitest';
import { LearningProgressService } from '../learning-progress.service';

const identity = { userId: 'learner-1', brand: 'skillup' };
const section = {
  id: 'section-1', subtopicId: 'subtopic-1', navigationNodeId: 'node-1',
  content: { schemaVersion: 1, blocks: [
    { id: 'block-a', type: 'definition', version: 'D1' },
    { id: 'block-b', type: 'definition', version: 'D1' },
    { id: 'parent-block', type: 'two-column', presentation: { ratio: '50-50' }, content: {
      left: { blocks: [{ id: 'child-block', type: 'definition', version: 'D1' }] }, right: { blocks: [] },
    } },
  ] },
};

function fixture() {
  const row = { id: 'progress-1', userId: identity.userId, navigationNodeId: 'node-1', subtopicId: 'subtopic-1', sectionId: 'section-1', status: 'in_progress', completedBlocks: [], timeSpentActiveSec: 0, visitCount: 0, revisionCount: 0, firstViewedAt: null, lastViewedAt: null, completedAt: null };
  const repo = {
    getProgress: vi.fn(async () => undefined),
    createProgress: vi.fn(async () => row),
    markBlockCompleted: vi.fn(async (event: { blockId: string; blockVersion: string }) => ({ ...row, completedBlocks: [{ blockId: event.blockId, blockVersion: event.blockVersion, completedAt: new Date().toISOString() }] })),
  };
  const sections = { getTutorialByPageIdentity: vi.fn(async (subtopic: string, node: string, brand: string) => subtopic === 'subtopic-1' && node === 'node-1' && brand === 'skillup' ? section : undefined) };
  const blocks = { findByNavigationNode: vi.fn(async () => []) };
  const service = new LearningProgressService(repo as never, sections as never, blocks as never, {} as never);
  return { service, repo };
}

describe('B08-T08 canonical block membership', () => {
  it.each(['block-a', 'block-b'])('accepts distinct stored blocks sharing a type: %s', async (block) => {
    const f = fixture();
    await f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', block, 'definition', 'D1');
    expect(f.repo.markBlockCompleted).toHaveBeenCalledOnce();
  });
  it.each([['unknown', 'D1'], ['block-a', 'D2']])('rejects unowned block/version %s %s before writes', async (block, version) => {
    const f = fixture();
    const accepted = await f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', block, 'definition', version).then(() => true, () => false);
    expect.soft(accepted).toBe(false);
    expect.soft(f.repo.createProgress).not.toHaveBeenCalled();
    expect(f.repo.markBlockCompleted).not.toHaveBeenCalled();
  });
  it('passes the distinct nested child identity to the actual completion service', async () => {
    const f = fixture();
    await f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', 'child-block', 'definition', 'D1');
    expect(f.repo.markBlockCompleted).toHaveBeenCalledWith(expect.objectContaining({ blockId: 'child-block' }));
    // Membership enforcement remains independently required by the negative controls.
  });
  it.each([['other-node', 'section-1'], ['node-1', 'other-section']])('denies mismatched hierarchy before writes', async (node, sectionId) => {
    const f = fixture();
    await expect(f.service.recordBlockCompletion(identity, node, 'subtopic-1', sectionId, 'block-a', 'definition', 'D1')).rejects.toThrow();
    expect(f.repo.createProgress).not.toHaveBeenCalled();
    expect(f.repo.markBlockCompleted).not.toHaveBeenCalled();
  });
});
