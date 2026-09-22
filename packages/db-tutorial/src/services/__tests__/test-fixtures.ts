/**
 * Test Fixture Factories for Phase 2B.13
 * 
 * Creates canonical block structures matching production schemas.
 * Each factory produces schema-valid blocks that can be validated
 * against the corresponding Zod schemas.
 * 
 * IMPORTANT: These fixtures use the CANONICAL structure:
 * - D1, C1, I1: content: { page: { ... } }
 * - S1: content: { title?: string, points: string[] }
 */

import type {
  DefinitionD1Block,
  CodeC1Block,
  IntroductionI1Block,
  SummaryS1Block,
  BlockProgressRole,
  TutorialDocument,
  TutorialBlock
} from '@quiz/types';
import { randomUUID } from 'crypto';

/**
 * Generate a valid UUID for block IDs
 */
function generateBlockId(): string {
  return randomUUID();
}

/**
 * Create a minimal valid D1 block
 */
export function createD1Fixture(
  overrides?: Partial<DefinitionD1Block> & { progressRole?: BlockProgressRole }
): DefinitionD1Block {
  return {
    id: overrides?.id || generateBlockId(),
    type: 'definition',
    version: 'D1',
    content: {
      page: {
        type: 'definition',
        category: 'Test Category',
        title: 'Test Term',
        intro: 'Test introduction',
        definition: 'Test definition',
        explanation: ['Explanation point 1', 'Explanation point 2'],
        example: {
          language: 'javascript',
          code: 'const x = 1;'
        },
        characteristics: [
          {
            icon: 'check',
            title: 'Characteristic 1',
            description: 'Description 1'
          }
        ],
        takeaway: 'Test takeaway'
      }
    },
    ...overrides
  };
}

/**
 * Create a minimal valid C1 block
 */
export function createC1Fixture(
  overrides?: Partial<CodeC1Block> & { progressRole?: BlockProgressRole }
): CodeC1Block {
  return {
    id: overrides?.id || generateBlockId(),
    type: 'code',
    version: 'C1',
    content: {
      page: {
        type: 'code',
        title: 'Test Code Block',
        introduction: 'Test code introduction',
        language: 'javascript',
        code: 'const x = 1;\nconsole.log(x);',
        explanation: [
          {
            focus: 'const x = 1',
            description: 'Declares a constant'
          }
        ],
        takeaway: 'Test code takeaway'
      }
    },
    ...overrides
  };
}

/**
 * Create a minimal valid I1 block
 */
export function createI1Fixture(
  overrides?: Partial<IntroductionI1Block> & { progressRole?: BlockProgressRole }
): IntroductionI1Block {
  return {
    id: overrides?.id || generateBlockId(),
    type: 'introduction',
    version: 'I1',
    content: {
      page: {
        badge: 'Test Badge',
        title: 'Test Introduction',
        subtitle: 'Test subtitle',
        motto: {
          lines: ['Line 1', 'Line 2', 'Line 3', 'Line 4']
        },
        learningGoal: 'Test learning goal',
        topic: {
          title: 'The Topic',
          description: 'Topic description',
          quote: 'Topic quote'
        },
        whereFit: {
          title: 'Where Does It Fit?',
          description: 'Where fit description',
          flowCards: [
            {
              title: 'Card 1',
              subtitle: 'Subtitle 1',
              icon: 'book-open',
              highlight: true
            }
          ]
        },
        solution: {
          title: 'The Solution',
          description: 'Solution description',
          code: {
            language: 'javascript',
            code: 'const x = 1;'
          }
        },
        whereUsed: {
          title: 'Where Is It Used?',
          description: 'Where used description',
          useCases: [
            {
              title: 'Use Case 1',
              description: 'Use case description',
              icon: 'code',
              highlight: false
            }
          ]
        },
        roadmap: {
          title: 'What Will You Learn?',
          description: 'Roadmap description',
          steps: [
            {
              title: 'Step 1',
              subtitle: 'Step subtitle'
            }
          ]
        },
        whyMatters: {
          title: 'Why This Matters',
          benefits: [
            {
              title: 'Benefit 1',
              subtitle: 'Benefit subtitle',
              icon: 'star'
            }
          ]
        },
        keyTakeaway: 'Test key takeaway'
      }
    },
    ...overrides
  };
}

/**
 * Create a minimal valid S1 block
 * NOTE: S1 has different structure - NOT wrapped in page
 */
export function createS1Fixture(
  overrides?: Partial<SummaryS1Block> & { progressRole?: BlockProgressRole }
): SummaryS1Block {
  return {
    id: overrides?.id || generateBlockId(),
    type: 'summary',
    version: 'S1',
    content: {
      title: 'Test Summary',
      points: [
        'Summary point 1',
        'Summary point 2',
        'Summary point 3'
      ]
    },
    ...overrides
  };
}

/**
 * Create a test assessment block (generic structure for testing exclusion)
 */
export function createAssessmentFixture(id: string = 'assessment-1'): any {
  return {
    id,
    type: 'quiz',
    version: 'Q1',
    progressRole: 'assessment',
    content: {
      question: 'Test question',
      answers: [
        { id: 'a1', text: 'Answer 1', correct: true },
        { id: 'a2', text: 'Answer 2', correct: false }
      ]
    }
  };
}

/**
 * Create a test structural block (generic structure for testing exclusion)
 */
export function createStructuralFixture(id: string = 'structural-1'): any {
  return {
    id,
    type: 'heading',
    progressRole: 'structural',
    content: {
      text: 'Test Heading',
      level: 2
    }
  };
}

/**
 * Create an unversioned block (for testing exclusion)
 */
export function createUnversionedFixture(id: string = 'unversioned-1'): any {
  return {
    id,
    type: 'paragraph',
    content: 'Test paragraph content'
  };
}


/**
 * Create a minimal valid TutorialDocument
 */
export function createTutorialDocument(blocks: TutorialBlock[]): TutorialDocument {
  return {
    schemaVersion: 1,
    blocks
  };
}
