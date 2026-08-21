/**
 * Tutorial Document Test Fixtures
 * 
 * Uses established builder pattern from Phase 1H/Phase 2C
 * All fixtures validated against TutorialDocumentSchema
 */

import { buildTutorialDocument } from '@quiz/db-tutorial';
import type { TutorialDocument } from '@quiz/types';

/**
 * Create minimal valid TutorialDocument for testing
 * Uses project's canonical buildTutorialDocument() helper
 */
export function createValidTestDocument(options?: {
  heading?: string;
  content?: string;
}): TutorialDocument {
  return buildTutorialDocument(
    [
      {
        id: 'test-heading-1',
        type: 'heading',
        content: {
          text: options?.heading || 'Test Heading',
          level: 1,
        },
      },
      {
        id: 'test-paragraph-1',
        type: 'paragraph',
        content: {
          text: options?.content || 'Test paragraph content for integration testing.',
        },
      },
    ],
    {
      estimatedReadTime: 1,
      tags: ['test', 'integration'],
      complexityScore: 3,
    }
  );
}

/**
 * Create TutorialDocument with multiple blocks for update testing
 */
export function createMultiBlockTestDocument(): TutorialDocument {
  return buildTutorialDocument(
    [
      {
        id: 'test-heading-2',
        type: 'heading',
        content: {
          text: 'Multi-Block Test Document',
          level: 1,
        },
      },
      {
        id: 'test-paragraph-2',
        type: 'paragraph',
        content: {
          text: 'First paragraph.',
        },
      },
      {
        id: 'test-callout-1',
        type: 'callout',
        content: {
          text: 'Important callout information.',
          variant: 'info',
        },
      },
    ],
    {
      estimatedReadTime: 2,
      tags: ['test', 'multi-block'],
      complexityScore: 4,
    }
  );
}

/**
 * Create empty TutorialDocument for empty-publish testing
 * NOTE: This still needs metadata per schema requirements
 */
export function createEmptyTestDocument(): TutorialDocument {
  return buildTutorialDocument(
    [], // Empty blocks
    {
      estimatedReadTime: 0,
      tags: [],
      complexityScore: 1,
    }
  );
}

/**
 * Create invalid block structure for validation testing
 * This bypasses the builder to create intentionally invalid content
 */
export function createInvalidBlockDocument(): unknown {
  return {
    schemaVersion: 1,
    blocks: [
      {
        id: 'invalid-block-1',
        type: 'INVALID_TYPE', // Invalid type not in BLOCK_REGISTRY
        content: {
          text: 'This should be rejected',
        },
      },
    ],
    metadata: {
      estimatedReadTime: 1,
      tags: [],
      complexityScore: 3,
    },
  };
}
