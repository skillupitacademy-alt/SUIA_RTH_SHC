import { describe, expect, it, vi } from 'vitest';
import { TutorialDocumentSchema, validateDocumentForSection } from '@quiz/types';
import { validateCompletionMembership } from '../learning-progress.hierarchy-resolution';
import { createD1Fixture } from './test-fixtures';

describe('Sol canonical membership compatibility', () => {
  it.each([498, 499])('accepts a schema-valid document with %i root leaves and a nested child', async (leafCount) => {
    const document = {
      schemaVersion: 1 as const,
      blocks: [
        ...Array.from({ length: leafCount }, (_, index) => ({
          id: `leaf-${index}`,
          type: 'paragraph' as const,
          content: { text: 'Canonical structural content' },
        })),
        {
          id: 'container-block',
          type: 'two-column' as const,
          content: {
            left: { blocks: [createD1Fixture({ id: 'nested-child' })] },
            right: { blocks: [] },
          },
        },
      ],
    };
    expect(TutorialDocumentSchema.safeParse(document).success).toBe(true);
    expect(validateDocumentForSection(document, 'notes').valid).toBe(true);
    const sections = { getTutorialByPageIdentity: vi.fn(async () => ({ content: document })) };
    await expect(validateCompletionMembership(
      sections as never, 'subtopic', 'navigation',
      { userId: 'learner', brand: 'skillup' }, 'nested-child', 'D1',
    )).resolves.toBeUndefined();
  });
});
