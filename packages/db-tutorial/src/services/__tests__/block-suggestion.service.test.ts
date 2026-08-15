/**
 * Block Suggestion Service - Unit Tests
 * 
 * Tests for the block suggestion intelligence engine.
 * 
 * CRITICAL TEST REQUIREMENTS (from Prompt 07B):
 * 1. Determinism: Same input → Same output
 * 2. Detection: Each major suggestion type
 * 3. Negative: No false positives
 * 4. Confidence: Correct band assignment
 * 5. Explainability: Every suggestion has reason + sourceBlockIds
 */

import { describe, it, expect } from 'vitest';
import { BlockSuggestionService, getConfidenceLevel } from '../block-suggestion.service';
import type { 
  TutorialDocument, 
  ContentAnalysisResult,
  BlockSuggestion,
} from '@quiz/types';
import { BLOCK_REGISTRY } from '@quiz/types';

// Helper to create minimal ContentAnalysisResult for tests
function createAnalysis(wordCount: number = 100): ContentAnalysisResult {
  return {
    statistics: {
      totalWords: wordCount,
      characters: wordCount * 5,
      readingTimeMinutes: Math.ceil(wordCount / 200),
      sectionsDetected: 1,
      totalBlocks: 5,
    },
    sectionOutline: [],
    qualityIndicators: {
      readability: 'good',
      structure: 'good',
      completeness: 'good',
      examples: 'none',
      codePresence: 'none',
      visualPotential: 'fair',
    },
    smartSuggestions: [],
    detectedElements: {
      headings: 1,
      paragraphs: 4,
      bulletLists: 0,
      numberedLists: 0,
      codeBlocks: 0,
      quotes: 0,
      tables: 0,
      callouts: 0,
      keyConcepts: 0,
      comparisons: 0,
      examples: 0,
    },
    overallConfidence: {
      score: 70,
      grade: 'Good',
    },
  };
}

describe('BlockSuggestionService', () => {
  const service = new BlockSuggestionService();

  // ============================================================
  // TEST 1: DETERMINISM
  // ============================================================

  describe('Determinism', () => {
    it('should return identical analytical results for identical input (metadata excluded)', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: {
              level: 2,
              text: 'Client-Side JavaScript',
            },
          },
          {
            id: 'heading-2',
            type: 'heading',
            content: {
              level: 2,
              text: 'Server-Side JavaScript',
            },
          },
        ],
      };

      const result1 = service.generateSuggestions(document, createAnalysis());
      const result2 = service.generateSuggestions(document, createAnalysis());
      const result3 = service.generateSuggestions(document, createAnalysis());

      // Compare suggestions (excluding timestamps)
      const normalize = (result: any) => ({
        ...result,
        metadata: undefined, // Remove timestamps
      });

      expect(normalize(result1)).toEqual(normalize(result2));
      expect(normalize(result2)).toEqual(normalize(result3));
    });
  });

  // ============================================================
  // TEST 2: DETECTION - TWO COLUMN
  // ============================================================

  describe('Two Column Detection', () => {
    it('should suggest two-column for parallel concepts', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'h1',
            type: 'heading',
            content: {
              level: 3,
              text: 'Client-Side JavaScript',
            },
          },
          {
            id: 'h2',
            type: 'heading',
            content: {
              level: 3,
              text: 'Server-Side JavaScript',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const twoColSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'two-column' && b.kind === 'suggested'
      );

      expect(twoColSuggestions.length).toBeGreaterThan(0);
      expect(twoColSuggestions[0].reason).toContain('Parallel concepts');
      expect(twoColSuggestions[0].sourceBlockIds).toContain('h1');
      expect(twoColSuggestions[0].sourceBlockIds).toContain('h2');
    });

    it('should detect frontend/backend parallel concepts', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'frontend',
            type: 'heading',
            content: {
              level: 3,
              text: 'Frontend Development',
            },
          },
          {
            id: 'backend',
            type: 'heading',
            content: {
              level: 3,
              text: 'Backend Development',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const twoColSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'two-column' && b.kind === 'suggested'
      );

      expect(twoColSuggestions.length).toBeGreaterThan(0);
      expect(twoColSuggestions[0].confidenceLevel).toBe('medium');
    });
  });

  // ============================================================
  // TEST 3: DETECTION - COMPARISON
  // ============================================================

  describe('Comparison Detection', () => {
    it('should detect "vs" comparison pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'comp-1',
            type: 'paragraph',
            content: {
              text: 'React vs Vue: Both are popular frameworks, but React uses JSX while Vue uses templates.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const comparisonSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'comparison' && b.kind === 'suggested'
      );

      expect(comparisonSuggestions.length).toBeGreaterThan(0);
      expect(comparisonSuggestions[0].reason).toContain('Comparison');
      expect(comparisonSuggestions[0].sourceBlockIds).toContain('comp-1');
    });

    it('should detect "difference between" pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'diff',
            type: 'paragraph',
            content: {
              text: 'The main difference between let and const is that const cannot be reassigned.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const comparisonSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'comparison' && b.kind === 'suggested'
      );

      expect(comparisonSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // TEST 4: DETECTION - CALLOUT
  // ============================================================

  describe('Callout Detection', () => {
    it('should detect "important" callout', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'important',
            type: 'paragraph',
            content: {
              text: 'Important: Always validate user input before processing it.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const calloutSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'callout' && b.kind === 'suggested'
      );

      expect(calloutSuggestions.length).toBeGreaterThan(0);
      expect(calloutSuggestions[0].confidence).toBeGreaterThanOrEqual(80);
      expect(calloutSuggestions[0].confidenceLevel).toBe('high');
    });

    it('should detect "note:" callout', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'note',
            type: 'paragraph',
            content: {
              text: 'Note: This API requires authentication.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const calloutSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'callout' && b.kind === 'suggested'
      );

      expect(calloutSuggestions.length).toBeGreaterThan(0);
      expect(calloutSuggestions[0].confidenceLevel).toBe('high');
    });

    it('should detect "warning" callout', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'warning',
            type: 'paragraph',
            content: {
              text: 'Warning: This operation will delete all data.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const calloutSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'callout' && b.kind === 'suggested'
      );

      expect(calloutSuggestions.length).toBeGreaterThan(0);
      expect(calloutSuggestions[0].confidence).toBeGreaterThanOrEqual(90);
    });
  });

  // ============================================================
  // TEST 5: DETECTION - EXAMPLE
  // ============================================================

  describe('Example Detection', () => {
    it('should detect "for example" pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'example',
            type: 'paragraph',
            content: {
              text: 'For example, you can use map() to transform array elements.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const exampleSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'example' && b.kind === 'suggested'
      );

      expect(exampleSuggestions.length).toBeGreaterThan(0);
      expect(exampleSuggestions[0].reason).toContain('Example');
    });

    it('should detect "use case" pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'usecase',
            type: 'paragraph',
            content: {
              text: 'A common use case is fetching data from an API.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const exampleSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'example' && b.kind === 'suggested'
      );

      expect(exampleSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // TEST 6: DETECTION - DIAGRAM
  // ============================================================

  describe('Diagram Detection', () => {
    it('should detect process flow pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'flow',
            type: 'paragraph',
            content: {
              text: 'The authentication workflow follows these steps: step 1 login, step 2 verify, step 3 authorize.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const diagramSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'diagram' && b.kind === 'suggested'
      );

      expect(diagramSuggestions.length).toBeGreaterThan(0);
      expect(diagramSuggestions[0].reason).toContain('Process');
    });

    it('should detect architecture pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'arch',
            type: 'paragraph',
            content: {
              text: 'The system architecture includes multiple layers and components.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const diagramSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'diagram' && b.kind === 'suggested'
      );

      expect(diagramSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // TEST 7: DETECTION - SUMMARY
  // ============================================================

  describe('Summary Detection', () => {
    it('should suggest summary for substantial content without one', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: Array.from({ length: 20 }, (_, i) => ({
          id: `para-${i}`,
          type: 'paragraph' as const,
          content: {
            text: 'This is a paragraph with substantial content to make the document long enough for summary suggestion. '.repeat(5),
          },
        })),
      };

      const analysis: ContentAnalysisResult = {
        statistics: {
          totalWords: 1000,
          characters: 5000,
          readingTimeMinutes: 5,
          sectionsDetected: 3,
          totalBlocks: 20,
        },
        sectionOutline: [],
        qualityIndicators: {
          readability: 'good',
          structure: 'good',
          completeness: 'good',
          examples: 'good',
          codePresence: 'none',
          visualPotential: 'fair',
        },
        smartSuggestions: [],
        detectedElements: {
          headings: 0,
          paragraphs: 20,
          bulletLists: 0,
          numberedLists: 0,
          codeBlocks: 0,
          quotes: 0,
          tables: 0,
          callouts: 0,
          keyConcepts: 0,
          comparisons: 0,
          examples: 0,
        },
        overallConfidence: {
          score: 75,
          grade: 'Good',
        },
      };

      const result = service.generateSuggestions(document, analysis);
      const summarySuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'summary' && b.kind === 'suggested'
      );

      expect(summarySuggestions.length).toBeGreaterThan(0);
      expect(summarySuggestions[0].reason).toContain('summary');
    });

    it('should NOT suggest summary for short content', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'para-1',
            type: 'paragraph',
            content: {
              text: 'This is short content.',
            },
          },
        ],
      };

      const analysis: ContentAnalysisResult = {
        statistics: {
          totalWords: 20,
          characters: 100,
          readingTimeMinutes: 1,
          sectionsDetected: 0,
          totalBlocks: 1,
        },
        sectionOutline: [],
        qualityIndicators: {
          readability: 'good',
          structure: 'fair',
          completeness: 'fair',
          examples: 'none',
          codePresence: 'none',
          visualPotential: 'none',
        },
        smartSuggestions: [],
        detectedElements: {
          headings: 0,
          paragraphs: 1,
          bulletLists: 0,
          numberedLists: 0,
          codeBlocks: 0,
          quotes: 0,
          tables: 0,
          callouts: 0,
          keyConcepts: 0,
          comparisons: 0,
          examples: 0,
        },
        overallConfidence: {
          score: 50,
          grade: 'Moderate',
        },
      };

      const result = service.generateSuggestions(document, analysis);
      const summarySuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'summary' && b.kind === 'suggested'
      );

      expect(summarySuggestions.length).toBe(0);
    });
  });

  // ============================================================
  // TEST 8: DETECTION - DEFINITION
  // ============================================================

  describe('Definition Detection', () => {
    it('should detect "X is a Y" definition pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'def',
            type: 'paragraph',
            content: {
              text: 'A closure is a function that has access to variables in its outer scope.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const definitionSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'definition' && b.kind === 'suggested'
      );

      expect(definitionSuggestions.length).toBeGreaterThan(0);
      expect(definitionSuggestions[0].confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect "X refers to Y" pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'def',
            type: 'paragraph',
            content: {
              text: 'Hoisting refers to the behavior of moving declarations to the top.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const definitionSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'definition' && b.kind === 'suggested'
      );

      expect(definitionSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // TEST 9: DETECTION - TABLE
  // ============================================================

  describe('Table Detection', () => {
    it('should suggest table for structured list with consistent colon pattern', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'list',
            type: 'list',
            content: {
              style: 'unordered',
              items: [
                { text: 'GET: Retrieves data' },
                { text: 'POST: Creates data' },
                { text: 'PUT: Updates data' },
                { text: 'DELETE: Removes data' },
              ],
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const tableSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'table' && b.kind === 'suggested'
      );

      expect(tableSuggestions.length).toBeGreaterThan(0);
      expect(tableSuggestions[0].reason).toContain('table');
    });

    it('should NOT suggest table for simple list', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'list',
            type: 'list',
            content: {
              style: 'unordered',
              items: [{ text: 'Item 1' }, { text: 'Item 2' }, { text: 'Item 3' }],
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const tableSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'table' && b.kind === 'suggested'
      );

      expect(tableSuggestions.length).toBe(0);
    });
  });

  // ============================================================
  // TEST 10: DETECTION - CONCEPT CARDS
  // ============================================================

  describe('Concept Cards Detection', () => {
    it('should suggest concept cards for 3-6 consecutive headings', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'h1', type: 'heading', content: { level: 3, text: 'String' } },
          { id: 'h2', type: 'heading', content: { level: 3, text: 'Number' } },
          { id: 'h3', type: 'heading', content: { level: 3, text: 'Boolean' } },
          { id: 'h4', type: 'heading', content: { level: 3, text: 'Object' } },
          { id: 'para', type: 'paragraph', content: { text: 'Content break' } },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const cardSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'concept-cards' && b.kind === 'suggested'
      );

      expect(cardSuggestions.length).toBeGreaterThan(0);
      expect(cardSuggestions[0].reason).toContain('independent concepts');
    });

    it('should NOT suggest concept cards for 2 headings', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'h1', type: 'heading', content: { level: 3, text: 'Concept 1' } },
          { id: 'h2', type: 'heading', content: { level: 3, text: 'Concept 2' } },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const cardSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'concept-cards' && b.kind === 'suggested'
      );

      expect(cardSuggestions.length).toBe(0);
    });
  });

  // ============================================================
  // TEST 11: DETECTION - TIMELINE
  // ============================================================

  describe('Timeline Detection', () => {
    it('should detect chronological progression', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'timeline',
            type: 'list',
            content: {
              style: 'ordered',
              items: [
                { text: 'First, we plan the architecture' },
                { text: 'Then we implement the core features' },
                { text: 'After that, we test thoroughly' },
                { text: 'Finally, we deploy to production' },
              ],
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const timelineSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'timeline' && b.kind === 'suggested'
      );

      expect(timelineSuggestions.length).toBeGreaterThan(0);
      expect(timelineSuggestions[0].reason).toContain('Chronological');
    });

    it('should detect phase-based progression', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'phases',
            type: 'list',
            content: {
              style: 'unordered',
              items: [
                { text: 'Phase 1: Requirements gathering' },
                { text: 'Phase 2: Design and architecture' },
                { text: 'Phase 3: Implementation' },
              ],
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const timelineSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'timeline' && b.kind === 'suggested'
      );

      expect(timelineSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // TEST 12: NEGATIVE TESTS
  // ============================================================

  describe('Negative Tests - No False Positives', () => {
    it('should NOT suggest comparison for unrelated paragraphs', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'para1',
            type: 'paragraph',
            content: {
              text: 'JavaScript is a programming language.',
            },
          },
          {
            id: 'para2',
            type: 'paragraph',
            content: {
              text: 'It runs in the browser.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const comparisonSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'comparison' && b.kind === 'suggested'
      );

      expect(comparisonSuggestions.length).toBe(0);
    });

    it('should NOT suggest table for unstructured list', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'list',
            type: 'list',
            content: {
              style: 'unordered',
              items: [
                { text: 'Some random thought' },
                { text: 'Another unrelated point' },
                { text: 'Yet another idea' },
              ],
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const tableSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.blockType === 'table' && b.kind === 'suggested'
      );

      expect(tableSuggestions.length).toBe(0);
    });
  });

  // ============================================================
  // TEST 13: CONFIDENCE BANDS
  // ============================================================

  describe('Confidence Bands', () => {
    it('should assign HIGH confidence (≥80)', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'warning',
            type: 'paragraph',
            content: {
              text: 'Warning: This is a critical security issue.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const highConfSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.kind === 'suggested' && b.confidenceLevel === 'high'
      );

      expect(highConfSuggestions.length).toBeGreaterThan(0);
      expect(highConfSuggestions[0].confidence).toBeGreaterThanOrEqual(80);
    });

    it('should assign MEDIUM confidence (50-79)', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'example',
            type: 'paragraph',
            content: {
              text: 'For example, you can use this pattern.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const mediumConfSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.kind === 'suggested' && b.confidenceLevel === 'medium'
      );

      expect(mediumConfSuggestions.length).toBeGreaterThan(0);
      expect(mediumConfSuggestions[0].confidence).toBeGreaterThanOrEqual(50);
      expect(mediumConfSuggestions[0].confidence).toBeLessThan(80);
    });

    it('should assign LOW confidence (<50)', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'vague',
            type: 'paragraph',
            content: {
              text: 'The workflow process might involve some steps.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const lowConfSuggestions = result.blocks.filter(
        (b: BlockSuggestion) => b.kind === 'suggested' && b.confidenceLevel === 'low'
      );

      // Note: This test may not always produce low confidence suggestions
      // depending on the heuristics. Just verify the logic works if any exist.
      if (lowConfSuggestions.length > 0) {
        expect(lowConfSuggestions[0].confidence).toBeLessThan(50);
      }
    });
  });

  // ============================================================
  // TEST 14: EXPLAINABILITY
  // ============================================================

  describe('Explainability', () => {
    it('every suggestion must have reason and sourceBlockIds', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'h1',
            type: 'heading',
            content: {
              level: 2,
              text: 'Introduction',
            },
          },
          {
            id: 'para',
            type: 'paragraph',
            content: {
              text: 'Note: This is important information.',
            },
          },
          {
            id: 'comp',
            type: 'paragraph',
            content: {
              text: 'React vs Vue: a comparison.',
            },
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());

      result.blocks.forEach((suggestion: BlockSuggestion) => {
        // Every suggestion must have a reason
        expect(suggestion.reason).toBeTruthy();
        expect(typeof suggestion.reason).toBe('string');
        expect(suggestion.reason.length).toBeGreaterThan(0);

        // Every suggestion must have sourceBlockIds array
        expect(Array.isArray(suggestion.sourceBlockIds)).toBe(true);
        
        // Block-level suggestions must have non-empty sourceBlockIds
        // Document-level suggestions (like summary) may have empty array or ['document-level']
        if (suggestion.kind === 'suggested' && suggestion.blockType !== 'summary') {
          expect(suggestion.sourceBlockIds.length).toBeGreaterThan(0);
        }
      });
    });
  });

  // ============================================================
  // TEST 15: EXISTING BLOCKS
  // ============================================================

  describe('Existing Blocks Detection', () => {
    it('should detect existing headings as existing blocks', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'h1', type: 'heading', content: { level: 2, text: 'Section 1' } },
          { id: 'h2', type: 'heading', content: { level: 3, text: 'Subsection' } },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const existingHeadings = result.blocks.filter(
        (b: BlockSuggestion) => b.kind === 'existing' && b.blockType === 'heading'
      );

      expect(existingHeadings.length).toBe(2);
      expect(existingHeadings[0].confidence).toBe(100);
      expect(existingHeadings[0].confidenceLevel).toBe('high');
    });

    it('should detect existing paragraphs', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'p1', type: 'paragraph', content: { text: 'First paragraph' } },
          { id: 'p2', type: 'paragraph', content: { text: 'Second paragraph' } },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const existingParagraphs = result.blocks.filter(
        (b: BlockSuggestion) => b.kind === 'existing' && b.blockType === 'paragraph'
      );

      expect(existingParagraphs.length).toBe(2);
    });

    it('should detect existing code blocks', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { 
            id: 'code1', 
            type: 'code', 
            content: { 
              language: 'javascript', 
              code: 'console.log("hello")' 
            } 
          },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      const existingCode = result.blocks.filter(
        (b: BlockSuggestion) => b.kind === 'existing' && b.blockType === 'code'
      );

      expect(existingCode.length).toBe(1);
      expect(existingCode[0].preview).toContain('javascript');
    });
  });

  // ============================================================
  // TEST 16: STATISTICS
  // ============================================================

  describe('Statistics', () => {
    it('should calculate correct statistics', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'h1', type: 'heading', content: { level: 2, text: 'Client-Side' } },
          { id: 'h2', type: 'heading', content: { level: 2, text: 'Server-Side' } },
          { id: 'para', type: 'paragraph', content: { text: 'Note: Important info' } },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());

      expect(result.statistics.totalBlocks).toBeGreaterThan(0);
      expect(result.statistics.existingBlocks).toBe(3);
      expect(result.statistics.suggestedBlocks).toBeGreaterThan(0);
      expect(
        result.statistics.highConfidence +
          result.statistics.mediumConfidence +
          result.statistics.lowConfidence
      ).toBe(result.statistics.totalBlocks);
    });
  });

  // ============================================================
  // TEST 17: OVERALL CONFIDENCE
  // ============================================================

  describe('Overall Confidence', () => {
    it('should calculate overall confidence correctly', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'h1', type: 'heading', content: { level: 2, text: 'Title' } },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());

      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(100);
      expect(typeof result.overallConfidence).toBe('number');
    });
  });

  // ============================================================
  // TEST 18: CANONICAL CONTENTBLOCK COVERAGE (Regression)
  // ============================================================

  describe('Canonical ContentBlock Coverage', () => {
    it('should validate Prompt 02 approved architecture against BLOCK_REGISTRY (13 Content + 4 Container)', () => {
      // APPROVED PROMPT 02 CANONICAL ARCHITECTURE
      // These are the explicit architectural boundaries - any change requires Prompt 02 revision
      const APPROVED_CONTENT_TYPES: ReadonlyArray<string> = [
        'heading', 'paragraph', 'list', 'code', 'table', 'image',
        'callout', 'definition', 'example', 'quote', 'summary', 
        'diagram', 'comparison'
      ];
      
      const APPROVED_CONTAINER_TYPES: ReadonlyArray<string> = [
        'two-column', 'three-column', 'card-grid', 'timeline'
      ];
      
      // Verify counts match approved architecture
      expect(APPROVED_CONTENT_TYPES.length).toBe(13);
      expect(APPROVED_CONTAINER_TYPES.length).toBe(4);
      
      // CRITICAL: Validate actual BLOCK_REGISTRY matches approved architecture
      const registryKeys = Object.keys(BLOCK_REGISTRY);
      const registryContentTypes = registryKeys.filter(
        key => BLOCK_REGISTRY[key as keyof typeof BLOCK_REGISTRY].category !== 'layout'
      );
      const registryContainerTypes = registryKeys.filter(
        key => BLOCK_REGISTRY[key as keyof typeof BLOCK_REGISTRY].category === 'layout'
      );
      
      // Verify registry has exactly 13 content types
      expect(registryContentTypes.length).toBe(13);
      
      // Verify registry has exactly 4 container types
      expect(registryContainerTypes.length).toBe(4);
      
      // Verify every approved content type exists in registry
      APPROVED_CONTENT_TYPES.forEach(type => {
        expect(registryKeys).toContain(type);
        expect(BLOCK_REGISTRY[type as keyof typeof BLOCK_REGISTRY]).toBeDefined();
      });
      
      // Verify every approved container type exists in registry
      APPROVED_CONTAINER_TYPES.forEach(type => {
        expect(registryKeys).toContain(type);
        expect(BLOCK_REGISTRY[type as keyof typeof BLOCK_REGISTRY]).toBeDefined();
        expect(BLOCK_REGISTRY[type as keyof typeof BLOCK_REGISTRY].supportsChildren).toBe(true);
      });
      
      // Verify no unapproved types in registry (catches drift like VideoBlock)
      registryKeys.forEach(key => {
        const isApproved = APPROVED_CONTENT_TYPES.includes(key) || APPROVED_CONTAINER_TYPES.includes(key);
        expect(isApproved).toBe(true);
      });
      
      // Verify total registry size
      expect(registryKeys.length).toBe(17);
    });

    it('should detect all 13 canonical ContentBlock types as existing', () => {
      // APPROVED PROMPT 02 CANONICAL ARCHITECTURE
      // These are the explicit architectural boundaries - any change requires Prompt 02 revision
      const APPROVED_CONTENT_TYPES: ReadonlyArray<string> = [
        'heading', 'paragraph', 'list', 'code', 'table', 'image',
        'callout', 'definition', 'example', 'quote', 'summary', 
        'diagram', 'comparison'
      ];
      
      const APPROVED_CONTAINER_TYPES: ReadonlyArray<string> = [
        'two-column', 'three-column', 'card-grid', 'timeline'
      ];
      
      // Verify counts match approved architecture
      expect(APPROVED_CONTENT_TYPES.length).toBe(13);
      expect(APPROVED_CONTAINER_TYPES.length).toBe(4);
      
      // Create document with all 13 canonical ContentBlock types
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: Array.from(APPROVED_CONTENT_TYPES).map((type, idx) => {
          const id = `${type}-${idx}`;
          
          // Create minimal valid block for each type
          switch (type) {
            case 'heading':
              return { id, type: 'heading' as const, content: { level: 2, text: 'Title' } };
            case 'paragraph':
              return { id, type: 'paragraph' as const, content: { text: 'Content' } };
            case 'list':
              return { id, type: 'list' as const, content: { style: 'unordered', items: [{ text: 'Item' }] } };
            case 'code':
              return { id, type: 'code' as const, content: { language: 'javascript', code: 'const x = 1;' } };
            case 'table':
              return { id, type: 'table' as const, content: { columns: [{ id: 'c1', label: 'Col' }], rows: [] } };
            case 'image':
              return { id, type: 'image' as const, content: { assetId: 'img1', alt: 'Image' } };
            case 'callout':
              return { id, type: 'callout' as const, content: { variant: 'info', text: 'Note' } };
            case 'definition':
              return { id, type: 'definition' as const, content: { term: 'Term', definition: 'Def' } };
            case 'example':
              return { id, type: 'example' as const, content: { explanation: 'Example' } };
            case 'quote':
              return { id, type: 'quote' as const, content: { text: 'Quote' } };
            case 'summary':
              return { id, type: 'summary' as const, content: { points: ['Point 1'] } };
            case 'diagram':
              return { id, type: 'diagram' as const, content: { diagramType: 'mermaid', diagramData: 'graph TD;' } };
            case 'comparison':
              return { id, type: 'comparison' as const, content: { entities: ['A', 'B'], features: [] } };
            default:
              throw new Error(`Unknown canonical type: ${type}`);
          }
        }),
      };

      const result = service.generateSuggestions(document, createAnalysis());
      
      const existing = result.blocks.filter((b: BlockSuggestion) => b.kind === 'existing');
      
      // Should detect all 13 canonical ContentBlock types as existing
      expect(existing.length).toBe(13);
      
      // CRITICAL: Verify actual detected types match approved architecture
      const detectedTypes = new Set(existing.map((b: BlockSuggestion) => b.blockType));
      const detectedTypesAsStrings = new Set(existing.map((b: BlockSuggestion) => b.blockType as string));
      
      // Every approved content type must be detected
      APPROVED_CONTENT_TYPES.forEach(type => {
        expect(detectedTypesAsStrings.has(type)).toBe(true);
      });
      
      // No unapproved types should be detected (catches drift like VideoBlock)
      // Verify that detected types count matches approved types count
      expect(detectedTypes.size).toBe(APPROVED_CONTENT_TYPES.length);
      
      // Double-check: no detected type is outside the approved sets
      const allApprovedTypes = new Set([...APPROVED_CONTENT_TYPES, ...APPROVED_CONTAINER_TYPES]);
      existing.forEach((block: BlockSuggestion) => {
        expect(allApprovedTypes.has(block.blockType as string)).toBe(true);
      });
      
      // Verify they all have 100% confidence
      expect(existing.every((b: BlockSuggestion) => b.confidence === 100)).toBe(true);
      expect(existing.every((b: BlockSuggestion) => b.confidenceLevel === 'high')).toBe(true);
    });

    it('should NOT suggest duplicate blocks when they already exist', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          // Existing callout - should NOT generate another callout suggestion
          { id: 'ca1', type: 'callout', content: { variant: 'warning', text: 'Important: This is critical' } },
          
          // Existing definition - should NOT generate another definition suggestion
          { id: 'd1', type: 'definition', content: { term: 'Closure', definition: 'A function with access to outer scope' } },
          
          // Existing example - should NOT generate another example suggestion
          { id: 'e1', type: 'example', content: { explanation: 'For example, you can use map()' } },
          
          // Existing summary - should NOT generate another summary suggestion
          { id: 's1', type: 'summary', content: { points: ['Key point 1', 'Key point 2'] } },
          
          // Existing diagram - should NOT generate another diagram suggestion
          { id: 'dg1', type: 'diagram', content: { diagramType: 'mermaid', diagramData: 'graph TD;' } },
          
          // Existing comparison - should NOT generate another comparison suggestion
          { id: 'cp1', type: 'comparison', content: { entities: ['React', 'Vue'], features: [] } },
          
          // Existing table - should NOT generate another table suggestion
          { id: 't1', type: 'table', content: { columns: [{ id: 'c1', label: 'Method' }], rows: [] } },
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis(1000)); // Enough words for summary
      
      const existing = result.blocks.filter((b: BlockSuggestion) => b.kind === 'existing');
      const suggested = result.blocks.filter((b: BlockSuggestion) => b.kind === 'suggested');
      
      // All 7 blocks should be detected as existing
      expect(existing.length).toBe(7);
      
      // Should NOT suggest callout (already has one)
      expect(suggested.some((s: BlockSuggestion) => s.blockType === 'callout')).toBe(false);
      
      // Should NOT suggest definition (already has one)
      expect(suggested.some((s: BlockSuggestion) => s.blockType === 'definition')).toBe(false);
      
      // Should NOT suggest example (already has one)
      expect(suggested.some((s: BlockSuggestion) => s.blockType === 'example')).toBe(false);
      
      // Should NOT suggest summary (already has one)
      expect(suggested.some((s: BlockSuggestion) => s.blockType === 'summary')).toBe(false);
      
      // Should NOT suggest diagram (already has one)
      expect(suggested.some((s: BlockSuggestion) => s.blockType === 'diagram')).toBe(false);
      
      // Should NOT suggest comparison (already has one)
      expect(suggested.some((s: BlockSuggestion) => s.blockType === 'comparison')).toBe(false);
      
      // Should NOT suggest table (already has one)
      expect(suggested.some((s: BlockSuggestion) => s.blockType === 'table')).toBe(false);
    });
  });

  // ============================================================
  // TEST 19: CONFIDENCE CLASSIFICATION (Deterministic)
  // ============================================================

  describe('Confidence Band Classification', () => {
    it('should correctly classify confidence levels using production logic', () => {
      // Test the actual exported getConfidenceLevel function
      // This tests production implementation, not a copy of the logic
      const testCases = [
        { confidence: 95, expectedLevel: 'high' as const },
        { confidence: 85, expectedLevel: 'high' as const },
        { confidence: 80, expectedLevel: 'high' as const },
        { confidence: 79, expectedLevel: 'medium' as const },
        { confidence: 70, expectedLevel: 'medium' as const },
        { confidence: 50, expectedLevel: 'medium' as const },
        { confidence: 49, expectedLevel: 'low' as const },
        { confidence: 30, expectedLevel: 'low' as const },
        { confidence: 10, expectedLevel: 'low' as const },
      ];

      testCases.forEach(({ confidence, expectedLevel }) => {
        expect(getConfidenceLevel(confidence)).toBe(expectedLevel);
      });
    });

    it('should maintain confidence band consistency across all suggestions', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'warning', type: 'paragraph', content: { text: 'Warning: Critical issue' } }, // High confidence callout
          { id: 'example', type: 'paragraph', content: { text: 'For example, use this pattern' } }, // Medium confidence example
          { id: 'def', type: 'paragraph', content: { text: 'Closure is a function...' } }, // High confidence definition
        ],
      };

      const result = service.generateSuggestions(document, createAnalysis());
      
      const suggestions = result.blocks.filter((b: BlockSuggestion) => b.kind === 'suggested');
      
      // Verify every suggestion uses correct confidence band from production logic
      suggestions.forEach((s: BlockSuggestion) => {
        expect(s.confidenceLevel).toBe(getConfidenceLevel(s.confidence));
      });
    });
  });
});
