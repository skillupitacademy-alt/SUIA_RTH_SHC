/**
 * Presentation Ideas Service Tests
 * PROMPT 14B: Tests for presentation recommendation engine
 */

import { describe, it, expect } from 'vitest';
import { PresentationIdeasService } from '../presentation-ideas.service';
import type {
  TutorialDocument,
  ContentAnalysisResult,
  BlockSuggestionResult,
  BlockSuggestion,
} from '@quiz/types';
import { CURRENT_SCHEMA_VERSION } from '@quiz/types';

describe('PresentationIdeasService', () => {
  const service = new PresentationIdeasService();

  // Helper to create minimal analysis
  const createAnalysis = (overrides: Partial<ContentAnalysisResult> = {}): ContentAnalysisResult => ({
    statistics: {
      totalWords: 500,
      characters: 3000,
      readingTimeMinutes: 5,
      sectionsDetected: 3,
      totalBlocks: 10,
    },
    sectionOutline: [
      {
        id: 'section-1',
        level: 'h1',
        title: 'Introduction',
        snippet: 'This is an introduction',
        confidence: 95,
      },
    ],
    qualityIndicators: {
      readability: 'good',
      structure: 'good',
      completeness: 'fair',
      examples: 'good',
      codePresence: 'good',
      visualPotential: 'high',
    },
    smartSuggestions: [],
    detectedElements: {
      headings: 3,
      paragraphs: 8,
      bulletLists: 2,
      numberedLists: 1,
      codeBlocks: 2,
      quotes: 0,
      tables: 0,
      callouts: 0,
      keyConcepts: 0,
      comparisons: 0,
      examples: 0,
    },
    overallConfidence: {
      score: 85,
      grade: 'High',
    },
    ...overrides,
  });

  // Helper to create block suggestions
  const createBlockSuggestions = (suggestions: BlockSuggestion[] = []): BlockSuggestionResult => ({
    statistics: {
      totalBlocks: 10 + suggestions.length,
      existingBlocks: 10,
      suggestedBlocks: suggestions.length,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      sectionsDetected: 3,
      byType: {},
    },
    blocks: suggestions,
    sourcePreview: {
      raw: 'Sample content',
    },
    overallConfidence: 85,
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  });

  describe('generatePresentationIdeas', () => {
    it('should generate presentation ideas from document, analysis, and suggestions', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Introduction', level: 1 },
          },
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'This is a paragraph' },
          },
        ],
      };

      const analysis = createAnalysis();
      const blockSuggestions = createBlockSuggestions();

      const result = service.generatePresentationIdeas(
        document,
        analysis,
        blockSuggestions
      );

      expect(result).toBeDefined();
      expect(result.ideas).toBeInstanceOf(Array);
      expect(result.statistics).toBeDefined();
      expect(result.contextOutline).toBeDefined();
      expect(result.bestPractices).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.generatedAt).toBeDefined();
    });

    it('should generate deterministic IDs for same input', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-1',
          kind: 'suggested',
          blockType: 'concept-cards',
          title: 'Concept Cards',
          preview: '3 concepts',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'Multiple concepts detected',
          sourceBlockIds: ['block-1', 'block-2', 'block-3'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result1 = service.generatePresentationIdeas(document, analysis, blockSuggestions);
      const result2 = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      expect(result1.ideas.length).toBeGreaterThan(0);
      expect(result1.ideas[0].id).toBe(result2.ideas[0].id);
    });
  });

  describe('concept-cards → card-grid mapping', () => {
    it('should map concept-cards suggestion to card-grid block type', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-cards',
          kind: 'suggested',
          blockType: 'concept-cards', // Suggestion type
          title: 'Concept Cards',
          preview: '3 independent concepts',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'Multiple independent concepts detected',
          sourceBlockIds: ['block-1', 'block-2', 'block-3'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      const cardGridIdea = result.ideas.find((i: any) => i.type === 'card-grid');
      expect(cardGridIdea).toBeDefined();
      expect(cardGridIdea?.targetBlockType).toBe('card-grid'); // NOT concept-cards
      expect(cardGridIdea?.wireframeType).toBe('concept-cards-grid');
      expect(cardGridIdea?.presentationConfig).toMatchObject({
        targetBlockType: 'card-grid',
        columns: expect.any(Number),
        gap: 'normal',
      });
    });

    it('should never create concept-cards as targetBlockType', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-cards',
          kind: 'suggested',
          blockType: 'concept-cards',
          title: 'Concept Cards',
          preview: '4 concepts',
          confidence: 90,
          confidenceLevel: 'high',
          reason: 'Four independent concepts detected',
          sourceBlockIds: ['block-1', 'block-2', 'block-3', 'block-4'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      // Verify NO idea has targetBlockType: 'concept-cards'
      const hasConceptCards = result.ideas.some((idea: any) => idea.targetBlockType === 'concept-cards');
      expect(hasConceptCards).toBe(false);
    });
  });

  describe('two-column recommendations', () => {
    it('should extract two-column idea from block suggestions', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-twocol',
          kind: 'suggested',
          blockType: 'two-column',
          title: 'Two-Column Layout',
          preview: 'Parallel concepts',
          confidence: 88,
          confidenceLevel: 'high',
          reason: 'Parallel concepts detected',
          sourceBlockIds: ['block-1', 'block-2'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      const twoColIdea = result.ideas.find((i: any) => i.type === 'layout' && i.targetBlockType === 'two-column');
      expect(twoColIdea).toBeDefined();
      expect(twoColIdea?.targetBlockType).toBe('two-column');
      expect(twoColIdea?.wireframeType).toBe('two-column-50-50');
    });
  });

  describe('comparison recommendations', () => {
    it('should extract comparison idea from block suggestions', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-comparison',
          kind: 'suggested',
          blockType: 'comparison',
          title: 'Comparison Table',
          preview: 'Contrasting concepts',
          confidence: 82,
          confidenceLevel: 'high',
          reason: 'Contrasting concepts detected',
          sourceBlockIds: ['block-1', 'block-2'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      const comparisonIdea = result.ideas.find((i: any) => i.type === 'comparison');
      expect(comparisonIdea).toBeDefined();
      expect(comparisonIdea?.targetBlockType).toBe('comparison');
      expect(comparisonIdea?.wireframeType).toBe('comparison-table');
    });
  });

  describe('timeline recommendations', () => {
    it('should extract timeline idea from block suggestions', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-timeline',
          kind: 'suggested',
          blockType: 'timeline',
          title: 'Timeline',
          preview: 'Sequential steps',
          confidence: 80,
          confidenceLevel: 'high',
          reason: 'Sequential content detected',
          sourceBlockIds: ['block-1', 'block-2', 'block-3'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      const timelineIdea = result.ideas.find((i: any) => i.type === 'timeline');
      expect(timelineIdea).toBeDefined();
      expect(timelineIdea?.targetBlockType).toBe('timeline');
      expect(timelineIdea?.wireframeType).toBe('timeline-vertical');
    });

    it('should suggest timeline for numbered lists', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'list-1',
            type: 'list',
            content: {
              style: 'ordered',
              items: [
                { text: 'Step 1', children: [] },
                { text: 'Step 2', children: [] },
                { text: 'Step 3', children: [] },
              ],
            },
          },
        ],
      };

      const analysis = createAnalysis({
        detectedElements: {
          ...createAnalysis().detectedElements,
          numberedLists: 1,
        },
      });
      const blockSuggestions = createBlockSuggestions();

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      const timelineIdea = result.ideas.find((i: any) => i.type === 'timeline');
      expect(timelineIdea).toBeDefined();
    });
  });

  describe('callout recommendations', () => {
    it('should extract callout idea from block suggestions', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-callout',
          kind: 'suggested',
          blockType: 'callout',
          title: 'Important Callout',
          preview: 'Key point',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'Important concept detected',
          sourceBlockIds: ['block-1'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      const calloutIdea = result.ideas.find((i: any) => i.type === 'callout');
      expect(calloutIdea).toBeDefined();
      expect(calloutIdea?.targetBlockType).toBe('callout');
    });
  });

  describe('code example recommendations', () => {
    it('should suggest code examples when code blocks are present', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'code-1',
            type: 'code',
            content: {
              language: 'javascript',
              code: 'console.log("hello");',
            },
          },
          {
            id: 'code-2',
            type: 'code',
            content: {
              language: 'javascript',
              code: 'const x = 5;',
            },
          },
        ],
      };

      const analysis = createAnalysis({
        detectedElements: {
          ...createAnalysis().detectedElements,
          codeBlocks: 2,
        },
      });
      const blockSuggestions = createBlockSuggestions();

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      const codeExampleIdea = result.ideas.find((i: any) => i.type === 'code-example');
      expect(codeExampleIdea).toBeDefined();
      expect(codeExampleIdea?.targetBlockType).toBe('example');
    });
  });

  describe('statistics calculation', () => {
    it('should calculate correct statistics', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-1',
          kind: 'suggested',
          blockType: 'concept-cards',
          title: 'Cards',
          preview: 'preview',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'reason',
          sourceBlockIds: ['block-1'],
          status: 'pending',
        },
        {
          id: 'suggestion-2',
          kind: 'suggested',
          blockType: 'two-column',
          title: 'Two Column',
          preview: 'preview',
          confidence: 70,
          confidenceLevel: 'medium',
          reason: 'reason',
          sourceBlockIds: ['block-2'],
          status: 'pending',
        },
        {
          id: 'suggestion-3',
          kind: 'suggested',
          blockType: 'callout',
          title: 'Callout',
          preview: 'preview',
          confidence: 40,
          confidenceLevel: 'low',
          reason: 'reason',
          sourceBlockIds: ['block-3'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      expect(result.statistics.total).toBeGreaterThan(0);
      expect(result.statistics.high).toBeGreaterThanOrEqual(1);
      expect(result.statistics.medium).toBeGreaterThanOrEqual(1);
      expect(result.statistics.low).toBeGreaterThanOrEqual(1);
      expect(result.statistics.byType).toBeDefined();
    });
  });

  describe('context outline', () => {
    it('should build context outline from document and analysis', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          { id: 'b1', type: 'heading', content: { text: 'H1', level: 1 } },
          { id: 'b2', type: 'paragraph', content: { text: 'text' } },
        ],
      };

      const analysis = createAnalysis({
        sectionOutline: [
          {
            id: 's1',
            level: 'h1',
            title: 'Introduction',
            snippet: 'intro text',
            confidence: 95,
          },
          {
            id: 's2',
            level: 'h2',
            title: 'Details',
            snippet: 'detail text',
            confidence: 90,
          },
        ],
      });
      const blockSuggestions = createBlockSuggestions();

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      expect(result.contextOutline.totalSections).toBe(2);
      expect(result.contextOutline.totalBlocks).toBe(2);
      expect(result.contextOutline.totalWords).toBe(500);
      expect(result.contextOutline.mainSections).toHaveLength(2);
    });
  });

  describe('best practices', () => {
    it('should generate best practices guidance', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const blockSuggestions = createBlockSuggestions();

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      expect(result.bestPractices).toBeInstanceOf(Array);
      expect(result.bestPractices.length).toBeGreaterThan(0);
      expect(result.bestPractices[0]).toMatchObject({
        id: expect.any(String),
        category: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        priority: expect.any(String),
      });
    });
  });

  describe('deduplication', () => {
    it('should deduplicate ideas with same stable IDs', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'suggestion-1',
          kind: 'suggested',
          blockType: 'concept-cards',
          title: 'Cards',
          preview: 'preview',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'reason',
          sourceBlockIds: ['block-1', 'block-2'], // Same blocks
          status: 'pending',
        },
        {
          id: 'suggestion-2',
          kind: 'suggested',
          blockType: 'concept-cards',
          title: 'Cards Duplicate',
          preview: 'preview',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'reason',
          sourceBlockIds: ['block-1', 'block-2'], // Same blocks → same ID
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      // Should only have one card-grid idea (deduplicated)
      const cardGridIdeas = result.ideas.filter((i: any) => i.type === 'card-grid');
      expect(cardGridIdeas.length).toBe(1);
    });
  });

  describe('only processes suggested blocks', () => {
    it('should ignore existing blocks and only process suggested blocks', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 'existing-1',
          kind: 'existing', // Should be ignored
          blockType: 'heading',
          title: 'Existing Heading',
          preview: 'preview',
          confidence: 100,
          confidenceLevel: 'high',
          reason: 'detected',
          sourceBlockIds: ['block-1'],
          status: 'pending',
        },
        {
          id: 'suggested-1',
          kind: 'suggested', // Should be processed
          blockType: 'concept-cards',
          title: 'Suggested Cards',
          preview: 'preview',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'reason',
          sourceBlockIds: ['block-2'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      // Should only have ideas from suggested blocks
      const cardGridIdeas = result.ideas.filter((i: any) => i.type === 'card-grid');
      expect(cardGridIdeas.length).toBeGreaterThan(0);
    });
  });

  describe('canonical block types only', () => {
    it('should only use canonical BLOCK_REGISTRY types as targetBlockType', () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const analysis = createAnalysis();
      const suggestions: BlockSuggestion[] = [
        {
          id: 's1',
          kind: 'suggested',
          blockType: 'concept-cards',
          title: 'Cards',
          preview: 'p',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'r',
          sourceBlockIds: ['b1'],
          status: 'pending',
        },
        {
          id: 's2',
          kind: 'suggested',
          blockType: 'two-column',
          title: 'Two Col',
          preview: 'p',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'r',
          sourceBlockIds: ['b2'],
          status: 'pending',
        },
        {
          id: 's3',
          kind: 'suggested',
          blockType: 'comparison',
          title: 'Comp',
          preview: 'p',
          confidence: 85,
          confidenceLevel: 'high',
          reason: 'r',
          sourceBlockIds: ['b3'],
          status: 'pending',
        },
      ];
      const blockSuggestions = createBlockSuggestions(suggestions);

      const result = service.generatePresentationIdeas(document, analysis, blockSuggestions);

      // Verify all targetBlockTypes are from BLOCK_REGISTRY (17 types)
      const canonicalTypes = [
        'heading', 'paragraph', 'list', 'code', 'example',
        'image', 'diagram', 'table', 'comparison', 'callout',
        'quote', 'definition', 'summary', 'two-column',
        'three-column', 'card-grid', 'timeline',
      ];

      for (const idea of result.ideas) {
        expect(canonicalTypes).toContain(idea.targetBlockType);
      }
    });
  });
});
