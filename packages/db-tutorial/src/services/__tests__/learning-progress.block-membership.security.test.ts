import { describe, expect, it, vi } from 'vitest';
import { LearningProgressService } from '../learning-progress.service';
import { createD1Fixture } from './test-fixtures';
import { TutorialDocumentSchema, validateDocumentForSection } from '@quiz/types';

const identity = { userId: 'learner-1', brand: 'skillup' };
const section = {
  id: 'section-1', subtopicId: 'subtopic-1', navigationNodeId: 'node-1',
  content: { schemaVersion: 1, blocks: [
    createD1Fixture({ id: 'block-a' }),
    createD1Fixture({ id: 'block-b' }),
    { id: 'parent-block', type: 'two-column', presentation: { ratio: '50-50' }, content: {
      left: { blocks: [createD1Fixture({ id: 'child-block' })] }, right: { blocks: [] },
    } },
  ] },
};

function fixture(content: unknown = section.content) {
  const row = { id: 'progress-1', userId: identity.userId, navigationNodeId: 'node-1', subtopicId: 'subtopic-1', sectionId: 'section-1', status: 'in_progress', completedBlocks: [], timeSpentActiveSec: 0, visitCount: 0, revisionCount: 0, firstViewedAt: null, lastViewedAt: null, completedAt: null };
  const repo = {
    getProgress: vi.fn(async () => undefined),
    createProgress: vi.fn(async () => row),
    markBlockCompleted: vi.fn(async (event: { blockId: string; blockVersion: string }) => ({ ...row, completedBlocks: [{ blockId: event.blockId, blockVersion: event.blockVersion, completedAt: new Date().toISOString() }] })),
  };
  const sections = { getTutorialByPageIdentity: vi.fn(async (subtopic: string, node: string, brand: string) => subtopic === 'subtopic-1' && node === 'node-1' && brand === 'skillup' ? { ...section, content } : undefined) };
  const blocks = { findByNavigationNode: vi.fn(async () => []) };
  const service = new LearningProgressService(repo as never, sections as never, blocks as never, {} as never);
  return { service, repo };
}

describe('B08-T08 canonical block membership', () => {
  it('allows 500 valid root blocks plus a nested child through the actual service', async () => {
    const document = { schemaVersion: 1 as const, blocks: [
      ...Array.from({ length: 499 }, (_, i) => ({ id: `leaf-${i}`, type: 'paragraph' as const, content: { text: 'text' } })),
      { id: 'container', type: 'two-column' as const, content: { left: { blocks: [createD1Fixture({ id: 'nested-child' })] }, right: { blocks: [] } } },
    ] };
    expect(TutorialDocumentSchema.safeParse(document).success).toBe(true);
    expect(validateDocumentForSection(document, 'notes').valid).toBe(true);
    const f = fixture(document);
    await f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', 'nested-child', 'technical', 'D1');
    expect(f.repo.markBlockCompleted).toHaveBeenCalledOnce();
  });
  it.each([3, 4])('enforces supported nesting boundary at depth %i', async (depth) => {
    let block: unknown = createD1Fixture({ id: 'deep-child' });
    for (let i = 0; i < depth; i++) block = { id: `container-${i}`, type: 'two-column', content: { left: { blocks: [block] }, right: { blocks: [] } } };
    const f = fixture({ schemaVersion: 1, blocks: [block] });
    const call = f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', 'deep-child', 'definition', 'D1');
    if (depth === 3) {
      await expect(call).resolves.toBeDefined();
      expect(f.repo.markBlockCompleted).toHaveBeenCalledOnce();
    } else {
      await expect(call).rejects.toThrow();
      expect(f.repo.createProgress).not.toHaveBeenCalled();
      expect(f.repo.markBlockCompleted).not.toHaveBeenCalled();
    }
  });
  it('rejects cyclic content before any progress write', async () => {
    const blocks: unknown[] = [];
    blocks.push({ id: 'cycle', type: 'two-column', content: { left: { blocks }, right: { blocks: [] } } });
    const f = fixture({ schemaVersion: 1, blocks });
    await expect(f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', 'cycle', 'definition', 'D1')).rejects.toThrow();
    expect(f.repo.createProgress).not.toHaveBeenCalled();
    expect(f.repo.markBlockCompleted).not.toHaveBeenCalled();
  });
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
  it('preserves the definition to technical compatibility alias', async () => {
    const f = fixture();
    await f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', 'block-a', 'technical', 'D1');
    expect(f.repo.markBlockCompleted).toHaveBeenCalledOnce();
  });
  it.each(['three-column', 'card-grid', 'timeline'])('accepts child membership in %s', async (kind) => {
    const child = createD1Fixture({ id: 'descendant' });
    const content = kind === 'three-column'
      ? { columns: [{ blocks: [child] }, { blocks: [] }, { blocks: [] }] }
      : kind === 'card-grid' ? { cards: [{ id: 'card', blocks: [child] }] }
        : { items: [{ id: 'item', title: 'item', blocks: [child] }] };
    const f = fixture({ schemaVersion: 1, blocks: [{ id: 'container', type: kind, content }] });
    await f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', 'descendant', 'technical', 'D1');
    expect(f.repo.markBlockCompleted).toHaveBeenCalledOnce();
  });
  it.each([
    null,
    { schemaVersion: 1, blocks: null },
    { schemaVersion: 1, blocks: [{ id: 'block-a', type: 'definition', version: 'D1', content: {} }, { id: 'block-a', type: 'definition', version: 'D1', content: {} }] },
    { schemaVersion: 1, blocks: [{ id: 'container', type: 'two-column', content: { left: { blocks: [] } } }] },
    { schemaVersion: 1, blocks: [{ id: 'block-a', type: 'definition', version: 'D1' }] },
  ])('rejects absent, malformed or ambiguous content before mutation', async (content) => {
    const f = fixture(content);
    await expect(f.service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', 'section-1', 'block-a', 'definition', 'D1')).rejects.toThrow();
    expect(f.repo.createProgress).not.toHaveBeenCalled();
    expect(f.repo.markBlockCompleted).not.toHaveBeenCalled();
  });
  it.each([['other-node', 'section-1'], ['node-1', 'other-section']])('denies mismatched hierarchy before writes', async (node, sectionId) => {
    const f = fixture();
    await expect(f.service.recordBlockCompletion(identity, node, 'subtopic-1', sectionId, 'block-a', 'definition', 'D1')).rejects.toThrow();
    expect(f.repo.createProgress).not.toHaveBeenCalled();
    expect(f.repo.markBlockCompleted).not.toHaveBeenCalled();
  });
});
