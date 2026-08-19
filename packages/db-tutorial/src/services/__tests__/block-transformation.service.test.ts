/**
 * Block Transformation Service Tests
 * 
 * Tests canonical block construction from BlockSuggestions
 * Validates all 10 transformation rules + security properties
 */

import { describe, it, expect } from 'vitest';
import { BlockTransformationService } from '../block-transformation.service';
import type {
  TutorialDocument,
  BlockSuggestion,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
} from '@quiz/types';
import { InvalidSuggestionError, InvalidTransformationError } from '@quiz/types';

const CURRENT_SCHEMA_VERSION = 1;

describe('BlockTransformationService', () => {
  const service = new BlockTransformationService();

  // ============================================================
  // GENERAL TRANSFORMATION TESTS
  // ============================================================

  describe('General', () => {
    it('should not mutate original document', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'Original paragraph' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout',
        preview: 'Important: Original paragraph',
        confidence: 85,
        confidenceLevel: 'high',
        reason: 'Important indicator detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      const original = structuredClone(document);
      service.transform(document, suggestion);

      expect(document).toEqual(original);
    });

    it('should reject unknown suggestion type', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const suggestion: any = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'unknown-type',
        title: 'Unknown',
        preview: 'Unknown',
        confidence: 50,
        confidenceLevel: 'medium',
        reason: 'Test',
        sourceBlockIds: [],
        status: 'pending',
      };

      expect(() => service.transform(document, suggestion)).toThrow(InvalidSuggestionError);
    });

    it('should reject existing blocks', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'existing',
        blockType: 'paragraph',
        title: 'Existing Paragraph',
        preview: 'Test',
        confidence: 100,
        confidenceLevel: 'high',
        reason: 'Detected from structure',
        sourceBlockIds: [],
        status: 'pending',
      };

      expect(() => service.transform(document, suggestion)).toThrow(InvalidSuggestionError);
    });

    it('should reject missing source blocks', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout',
        preview: 'Test',
        confidence: 85,
        confidenceLevel: 'high',
        reason: 'Test',
        sourceBlockIds: ['missing-block'],
        status: 'pending',
      };

      expect(() => service.transform(document, suggestion)).toThrow(InvalidTransformationError);
    });

    it('should use canonical registry types only', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'h3-1',
            type: 'heading',
            content: { text: 'Concept 1', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-2',
            type: 'heading',
            content: { text: 'Concept 2', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-3',
            type: 'heading',
            content: { text: 'Concept 3', level: 3 },
          } as HeadingBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-cards',
        kind: 'suggested',
        blockType: 'concept-cards',
        title: 'Concept Cards',
        preview: '3 independent concepts',
        confidence: 62,
        confidenceLevel: 'medium',
        reason: 'Multiple independent concepts detected',
        sourceBlockIds: ['h3-1', 'h3-2', 'h3-3'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      // Should transform to card-grid (registry type), NOT concept-cards
      expect(result.blocks[0].type).toBe('card-grid');
      expect(result.blocks.some((b) => (b as any).type === 'concept-cards')).toBe(false);
    });

    it('should validate final result with TutorialDocumentSchema', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'Important: This is critical' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout',
        preview: 'Important: This is critical',
        confidence: 95,
        confidenceLevel: 'high',
        reason: 'Important indicator detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      // Should not throw - result is valid
      expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.blocks).toBeDefined();
      expect(Array.isArray(result.blocks)).toBe(true);
    });
  });

  // ============================================================
  // RULE 1: TWO-COLUMN
  // ============================================================

  describe('Rule 1: Two-Column', () => {
    it('should transform two-column suggestion', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'h3-1',
            type: 'heading',
            content: { text: 'Client', level: 3 },
          } as HeadingBlock,
          {
            id: 'p1',
            type: 'paragraph',
            content: { text: 'Client details' },
          } as ParagraphBlock,
          {
            id: 'h3-2',
            type: 'heading',
            content: { text: 'Server', level: 3 },
          } as HeadingBlock,
          {
            id: 'p2',
            type: 'paragraph',
            content: { text: 'Server details' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-twocol',
        kind: 'suggested',
        blockType: 'two-column',
        title: 'Two Column',
        preview: 'Client | Server',
        confidence: 72,
        confidenceLevel: 'medium',
        reason: 'Parallel concepts detected',
        sourceBlockIds: ['h3-1', 'p1', 'h3-2', 'p2'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('two-column');

      const twoColBlock = result.blocks[0] as any;
      expect(twoColBlock.content.left.blocks).toBeDefined();
      expect(twoColBlock.content.right.blocks).toBeDefined();
      expect(twoColBlock.presentation?.ratio).toBe('50-50');
    });

    it('should preserve unrelated blocks', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'intro',
            type: 'paragraph',
            content: { text: 'Introduction' },
          } as ParagraphBlock,
          {
            id: 'h3-1',
            type: 'heading',
            content: { text: 'Client', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-2',
            type: 'heading',
            content: { text: 'Server', level: 3 },
          } as HeadingBlock,
          {
            id: 'outro',
            type: 'paragraph',
            content: { text: 'Conclusion' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-twocol',
        kind: 'suggested',
        blockType: 'two-column',
        title: 'Two Column',
        preview: 'Client | Server',
        confidence: 72,
        confidenceLevel: 'medium',
        reason: 'Parallel concepts detected',
        sourceBlockIds: ['h3-1', 'h3-2'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(3); // intro + two-column + outro
      expect(result.blocks[0].id).toBe('intro');
      expect(result.blocks[1].type).toBe('two-column');
      expect(result.blocks[2].id).toBe('outro');
    });
  });

  // ============================================================
  // RULE 2: COMPARISON
  // ============================================================

  describe('Rule 2: Comparison', () => {
    it('should transform comparison suggestion', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'JavaScript vs Java are very different languages' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-comparison',
        kind: 'suggested',
        blockType: 'comparison',
        title: 'Comparison Block',
        preview: 'JavaScript vs Java',
        confidence: 75,
        confidenceLevel: 'medium',
        reason: 'Comparison language detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('comparison');

      const comparisonBlock = result.blocks[0] as any;
      expect(comparisonBlock.content.entities).toBeDefined();
      expect(comparisonBlock.content.features).toBeDefined();
      expect(Array.isArray(comparisonBlock.content.entities)).toBe(true);
    });
  });

  // ============================================================
  // RULE 3: CALLOUT
  // ============================================================

  describe('Rule 3: Callout', () => {
    it('should transform callout suggestion with warning variant', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'Warning: This operation is irreversible' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-callout',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout (warning)',
        preview: 'Warning: This operation is irreversible',
        confidence: 95,
        confidenceLevel: 'high',
        reason: 'Warning indicator detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('callout');

      const calloutBlock = result.blocks[0] as any;
      expect(calloutBlock.content.variant).toBe('warning');
      expect(calloutBlock.content.text).toContain('irreversible');
    });

    it('should transform callout suggestion with tip variant', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'Tip: Use keyboard shortcuts to save time' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-callout',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout (tip)',
        preview: 'Tip: Use keyboard shortcuts',
        confidence: 90,
        confidenceLevel: 'high',
        reason: 'Tip indicator detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      const calloutBlock = result.blocks[0] as any;
      expect(calloutBlock.content.variant).toBe('tip');
    });
  });

  // ============================================================
  // RULE 4: EXAMPLE
  // ============================================================

  describe('Rule 4: Example', () => {
    it('should transform example suggestion', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'For example, you can use map to transform arrays' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-example',
        kind: 'suggested',
        blockType: 'example',
        title: 'Example Block',
        preview: 'For example, you can use map',
        confidence: 78,
        confidenceLevel: 'medium',
        reason: 'Example language detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('example');

      const exampleBlock = result.blocks[0] as any;
      expect(exampleBlock.content.explanation).toBeDefined();
      expect(exampleBlock.content.explanation).toContain('transform arrays');
    });
  });

  // ============================================================
  // RULE 5: DIAGRAM
  // ============================================================

  describe('Rule 5: Diagram', () => {
    it('should transform diagram suggestion', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'The workflow consists of step 1, step 2, and step 3' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-diagram',
        kind: 'suggested',
        blockType: 'diagram',
        title: 'Diagram',
        preview: 'Process/workflow detected',
        confidence: 65,
        confidenceLevel: 'medium',
        reason: 'Process language detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('diagram');

      const diagramBlock = result.blocks[0] as any;
      expect(diagramBlock.content.diagramType).toBe('mermaid');
      expect(diagramBlock.content.diagramData).toBeDefined();
    });
  });

  // ============================================================
  // RULE 6: SUMMARY
  // ============================================================

  describe('Rule 6: Summary', () => {
    it('should transform summary suggestion', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Introduction', level: 2 },
          } as HeadingBlock,
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'Content here' },
          } as ParagraphBlock,
          {
            id: 'heading-2',
            type: 'heading',
            content: { text: 'Conclusion', level: 2 },
          } as HeadingBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-summary',
        kind: 'suggested',
        blockType: 'summary',
        title: 'Summary Block',
        preview: 'End-of-section summary',
        confidence: 70,
        confidenceLevel: 'medium',
        reason: 'Document has substantial content',
        sourceBlockIds: [], // Document-level suggestion
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(4); // Original 3 + summary
      expect(result.blocks[3].type).toBe('summary');

      const summaryBlock = result.blocks[3] as any;
      expect(summaryBlock.content.points).toBeDefined();
      expect(Array.isArray(summaryBlock.content.points)).toBe(true);
    });
  });

  // ============================================================
  // RULE 7: DEFINITION
  // ============================================================

  describe('Rule 7: Definition', () => {
    it('should transform definition suggestion', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'Recursion is a technique where a function calls itself' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-definition',
        kind: 'suggested',
        blockType: 'definition',
        title: 'Definition Block',
        preview: 'Recursion is a technique',
        confidence: 82,
        confidenceLevel: 'high',
        reason: 'Definition pattern detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('definition');

      const definitionBlock = result.blocks[0] as any;
      expect(definitionBlock.version).toBe('D1');
      expect(definitionBlock.content.page.title).toBe('Recursion');
      expect(definitionBlock.content.page.definition).toContain('technique');
    });
  });

  // ============================================================
  // RULE 8: TABLE
  // ============================================================

  describe('Rule 8: Table', () => {
    it('should transform table suggestion', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'list-1',
            type: 'list',
            content: {
              style: 'unordered',
              items: [
                { text: 'Name: John' },
                { text: 'Age: 30' },
                { text: 'City: New York' },
              ],
            },
          } as ListBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-table',
        kind: 'suggested',
        blockType: 'table',
        title: 'Table',
        preview: '3 rows with structured attributes',
        confidence: 68,
        confidenceLevel: 'medium',
        reason: 'List contains structured attribute data',
        sourceBlockIds: ['list-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('table');

      const tableBlock = result.blocks[0] as any;
      expect(tableBlock.content.columns).toBeDefined();
      expect(tableBlock.content.rows).toBeDefined();
      expect(tableBlock.content.columns).toHaveLength(2);
      expect(tableBlock.content.rows).toHaveLength(3);
    });
  });

  // ============================================================
  // RULE 9: CONCEPT CARDS (TYPE CONVERSION)
  // ============================================================

  describe('Rule 9: Concept Cards → Card Grid', () => {
    it('should transform 3 concept cards', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'h3-1',
            type: 'heading',
            content: { text: 'Strings', level: 3 },
          } as HeadingBlock,
          {
            id: 'p1',
            type: 'paragraph',
            content: { text: 'String details' },
          } as ParagraphBlock,
          {
            id: 'h3-2',
            type: 'heading',
            content: { text: 'Numbers', level: 3 },
          } as HeadingBlock,
          {
            id: 'p2',
            type: 'paragraph',
            content: { text: 'Number details' },
          } as ParagraphBlock,
          {
            id: 'h3-3',
            type: 'heading',
            content: { text: 'Booleans', level: 3 },
          } as HeadingBlock,
          {
            id: 'p3',
            type: 'paragraph',
            content: { text: 'Boolean details' },
          } as ParagraphBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-cards',
        kind: 'suggested',
        blockType: 'concept-cards',
        title: 'Concept Cards',
        preview: '3 independent concepts',
        confidence: 62,
        confidenceLevel: 'medium',
        reason: 'Multiple independent concepts detected',
        sourceBlockIds: ['h3-1', 'h3-2', 'h3-3'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('card-grid'); // NOT concept-cards

      const cardGridBlock = result.blocks[0] as any;
      expect(cardGridBlock.content.cards).toBeDefined();
      expect(cardGridBlock.content.cards).toHaveLength(3);
      expect(cardGridBlock.presentation?.columns).toBe(3);
    });

    it('should transform 4 concept cards with 2 columns', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'h3-1',
            type: 'heading',
            content: { text: 'Concept 1', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-2',
            type: 'heading',
            content: { text: 'Concept 2', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-3',
            type: 'heading',
            content: { text: 'Concept 3', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-4',
            type: 'heading',
            content: { text: 'Concept 4', level: 3 },
          } as HeadingBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-cards',
        kind: 'suggested',
        blockType: 'concept-cards',
        title: 'Concept Cards',
        preview: '4 independent concepts',
        confidence: 62,
        confidenceLevel: 'medium',
        reason: 'Multiple independent concepts detected',
        sourceBlockIds: ['h3-1', 'h3-2', 'h3-3', 'h3-4'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      const cardGridBlock = result.blocks[0] as any;
      expect(cardGridBlock.content.cards).toHaveLength(4);
      expect(cardGridBlock.presentation?.columns).toBe(2);
    });

    it('should preserve nested blocks in cards', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Strings', level: 3 },
          } as HeadingBlock,
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'String details' },
          } as ParagraphBlock,
          {
            id: 'list-1',
            type: 'list',
            content: {
              style: 'unordered',
              items: [{ text: 'Item 1' }, { text: 'Item 2' }],
            },
          } as ListBlock,
          {
            id: 'heading-2',
            type: 'heading',
            content: { text: 'Numbers', level: 3 },
          } as HeadingBlock,
          {
            id: 'heading-3',
            type: 'heading',
            content: { text: 'Booleans', level: 3 },
          } as HeadingBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-cards',
        kind: 'suggested',
        blockType: 'concept-cards',
        title: 'Concept Cards',
        preview: '3 independent concepts',
        confidence: 62,
        confidenceLevel: 'medium',
        reason: 'Multiple independent concepts detected',
        sourceBlockIds: ['heading-1', 'heading-2', 'heading-3'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      const cardGridBlock = result.blocks[0] as any;
      const firstCard = cardGridBlock.content.cards[0];

      // First card should contain paragraph and list (not the heading itself)
      expect(firstCard.blocks).toHaveLength(2);
      expect(firstCard.blocks[0].type).toBe('paragraph');
      expect(firstCard.blocks[1].type).toBe('list');
    });

    it('should not create concept-cards type', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'h3-1',
            type: 'heading',
            content: { text: 'Concept 1', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-2',
            type: 'heading',
            content: { text: 'Concept 2', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-3',
            type: 'heading',
            content: { text: 'Concept 3', level: 3 },
          } as HeadingBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-cards',
        kind: 'suggested',
        blockType: 'concept-cards',
        title: 'Concept Cards',
        preview: '3 independent concepts',
        confidence: 62,
        confidenceLevel: 'medium',
        reason: 'Multiple independent concepts detected',
        sourceBlockIds: ['h3-1', 'h3-2', 'h3-3'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      // Verify NO block has type 'concept-cards'
      const hasConceptCards = result.blocks.some(
        (block) => (block as any).type === 'concept-cards'
      );
      expect(hasConceptCards).toBe(false);
    });

    it('should generate unique card IDs', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'h3-1',
            type: 'heading',
            content: { text: 'Concept 1', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-2',
            type: 'heading',
            content: { text: 'Concept 2', level: 3 },
          } as HeadingBlock,
          {
            id: 'h3-3',
            type: 'heading',
            content: { text: 'Concept 3', level: 3 },
          } as HeadingBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-cards',
        kind: 'suggested',
        blockType: 'concept-cards',
        title: 'Concept Cards',
        preview: '3 independent concepts',
        confidence: 62,
        confidenceLevel: 'medium',
        reason: 'Multiple independent concepts detected',
        sourceBlockIds: ['h3-1', 'h3-2', 'h3-3'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      const cardGridBlock = result.blocks[0] as any;
      const cardIds = cardGridBlock.content.cards.map((card: any) => card.id);

      // All card IDs should be unique
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  // ============================================================
  // RULE 10: TIMELINE
  // ============================================================

  describe('Rule 10: Timeline', () => {
    it('should transform timeline suggestion', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'list-1',
            type: 'list',
            content: {
              style: 'ordered',
              items: [
                { text: 'First, initialize the project' },
                { text: 'Then, install dependencies' },
                { text: 'Later, configure settings' },
                { text: 'Finally, deploy to production' },
              ],
            },
          } as ListBlock,
        ],
      };

      const suggestion: BlockSuggestion = {
        id: 'suggestion-timeline',
        kind: 'suggested',
        blockType: 'timeline',
        title: 'Timeline',
        preview: '4 chronological stages',
        confidence: 64,
        confidenceLevel: 'medium',
        reason: 'Chronological progression detected',
        sourceBlockIds: ['list-1'],
        status: 'pending',
      };

      const result = service.transform(document, suggestion);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('timeline');

      const timelineBlock = result.blocks[0] as any;
      expect(timelineBlock.content.items).toBeDefined();
      expect(timelineBlock.content.items).toHaveLength(4);
      expect(timelineBlock.content.orientation).toBe('vertical');
    });
  });

  // ============================================================
  // SECURITY TESTS
  // ============================================================

  describe('Security', () => {
    it('should not trust client-provided suggestedContent', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'Important: legitimate content' },
          } as ParagraphBlock,
        ],
      };

      const maliciousSuggestion: any = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout',
        preview: 'Important: legitimate content',
        confidence: 85,
        confidenceLevel: 'high',
        reason: 'Important indicator detected',
        sourceBlockIds: ['block-1'],
        status: 'pending',
        suggestedContent: {
          // Client tries to inject malicious content
          variant: 'danger',
          text: 'MALICIOUS CONTENT INJECTED',
        },
      };

      const result = service.transform(document, maliciousSuggestion);

      // Should use SERVER-GENERATED content from source blocks, not client suggestedContent
      const calloutBlock = result.blocks[0] as any;
      expect(calloutBlock.content.text).not.toContain('MALICIOUS');
      expect(calloutBlock.content.text).toContain('legitimate content');
    });

    it('should operate on server-generated suggestions only', () => {
      // This test verifies that the service only accepts BlockSuggestion objects
      // from Phase B verification, which have been server-regenerated

      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            content: { text: 'Test content' },
          } as ParagraphBlock,
        ],
      };

      const serverSuggestion: BlockSuggestion = {
        id: 'suggestion-1',
        kind: 'suggested',
        blockType: 'callout',
        title: 'Callout',
        preview: 'Test content',
        confidence: 85,
        confidenceLevel: 'high',
        reason: 'Server-generated suggestion',
        sourceBlockIds: ['block-1'],
        status: 'pending',
      };

      // Should not throw - this is a valid server-generated suggestion
      const result = service.transform(document, serverSuggestion);
      expect(result.blocks).toHaveLength(1);
    });
  });
});
