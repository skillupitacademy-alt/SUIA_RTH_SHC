import { describe, expect, it } from 'vitest';
import { CodeBlockSchema, CodeC1BlockSchema } from '@quiz/types';
import { validateCompletionMembership } from '../learning-progress.hierarchy-resolution';
import { createC1Fixture } from './test-fixtures';

const blockId = '11111111-1111-4111-8111-111111111111';

function validate(block: unknown, version: string) {
  const sections = {
    getTutorialByPageIdentity: async () => ({
      content: { schemaVersion: 1, blocks: [block] },
    }),
  };
  return validateCompletionMembership(
    sections as never, 'subtopic', 'node',
    { userId: 'learner', brand: 'skillup' }, blockId, version, true,
  );
}

describe('Sol telemetry version representation', () => {
  it('accepts the supported legacy unversioned code representation', async () => {
    const block = {
      id: blockId, type: 'code',
      content: { language: 'javascript', code: 'const value = 1;' },
    };
    expect(CodeBlockSchema.safeParse(block).success).toBe(true);
    await expect(validate(block, 'unversioned')).resolves.toBeUndefined();
  });

  it('accepts a declared C1 identity', async () => {
    const block = createC1Fixture({ id: blockId });
    expect(CodeC1BlockSchema.safeParse(block).success).toBe(true);
    await expect(validate(block, 'C1')).resolves.toBeUndefined();
  });

  it.each([null, '', 42, {}, false])('denies invalid declared version %s', async version => {
    const block = { id: blockId, type: 'paragraph', version, content: { text: 'text' } };
    await expect(validate(block, 'unversioned')).rejects.toThrow();
  });

  it.each(['instructional', 'assessment', 'media'] as const)('denies unversioned structural type with %s role', async progressRole => {
    const block = { id: blockId, type: 'paragraph', progressRole, content: { text: 'text' } };
    await expect(validate(block, 'unversioned')).rejects.toThrow();
  });

  it.each([undefined, 'structural'] as const)('allows genuine unversioned structural content with role %s', async progressRole => {
    const block = { id: blockId, type: 'paragraph', progressRole, content: { text: 'text' } };
    await expect(validate(block, 'unversioned')).resolves.toBeUndefined();
  });

  it.each(['instructional', 'structural', 'assessment', 'media'] as const)('accepts exact versioned identity with role %s', async progressRole => {
    const block = createC1Fixture({ id: blockId, progressRole });
    await expect(validate(block, 'C1')).resolves.toBeUndefined();
    await expect(validate(block, 'D1')).rejects.toThrow();
  });

  it('denies a C1 content form with its version removed', async () => {
    const { version: _version, ...block } = createC1Fixture({ id: blockId });
    expect(CodeBlockSchema.safeParse(block).success).toBe(false);
    expect(CodeC1BlockSchema.safeParse(block).success).toBe(false);
    await expect(validate(block, 'unversioned')).rejects.toThrow();
  });
});
