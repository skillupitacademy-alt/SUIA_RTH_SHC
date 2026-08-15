/**
 * Content Analysis Service Tests
 * Unit tests for Prompt 06 backend implementation
 */

import { describe, it, expect } from 'vitest';
import { ContentAnalysisService } from '../content-analysis.service';
import type { TutorialDocument } from '@quiz/types';

describe('ContentAnalysisService', () => {
  const service = new ContentAnalysisService();

  const createSimpleDocument = (): TutorialDocument => ({
    schemaVersion: 1,
    metadata: {
      tags: ['test'],
      estimatedReadTime: 10,
      audience: 'beginner',
    },
    blocks: [
      {
        id: 'heading-1',
        type: 'heading',
        content: {
          level: 1,
          text: 'Introduction to Testing',
        },
        presentation: {
          alignment: 'left',
          spacing: 'normal',
        },
      },
      {
        id: 'paragraph-1',
        type: 'paragraph',
        content: {
          text: 'This is a test paragraph with some content to analyze. It contains multiple sentences. We want to test the analysis engine.',
        },
        presentation: {
          alignment: 'left',
          spacing: 'normal',
        },
      },
      {
        id: 'code-1',
        type: 'code',
        content: {
          language: 'javascript',
          code: 'console.log("Hello World");',
          caption: 'Example code',
          showLineNumbers: true,
        },
        presentation: {
          spacing: 'normal',
        },
      },
    ],
  });

  describe('analyzeDocument', () => {
    it('should return complete ContentAnalysisResult', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('sectionOutline');
      expect(result).toHaveProperty('qualityIndicators');
      expect(result).toHaveProperty('detectedElements');
      expect(result).toHaveProperty('smartSuggestions');
      expect(result).toHaveProperty('overallConfidence');
    });

    it('should include subtopicId if provided', () => {
      const document = createSimpleDocument();
      const subtopicId = '123e4567-e89b-12d3-a456-426614174000';
      const result = service.analyzeDocument(document, subtopicId);

      expect(result.subtopicId).toBe(subtopicId);
    });
  });

  describe('statistics calculation', () => {
    it('should calculate word count correctly', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result.statistics.totalWords).toBeGreaterThan(0);
      expect(result.statistics.characters).toBeGreaterThan(0);
      expect(result.statistics.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    });

    it('should count blocks correctly', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result.statistics.totalBlocks).toBe(3);
      expect(result.statistics.sectionsDetected).toBe(1); // 1 heading
    });

    it('should generate sections breakdown', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result.statistics.sectionsBreakdown).toContain('H1:');
      expect(result.statistics.sectionsBreakdown).toContain('H2:');
      expect(result.statistics.sectionsBreakdown).toContain('H3:');
    });
  });

  describe('section outline extraction', () => {
    it('should extract heading hierarchy', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        metadata: {
          tags: [],
          estimatedReadTime: 10,
          audience: 'beginner',
        },
        blocks: [
          {
            id: 'h1-1',
            type: 'heading',
            content: {
              level: 1,
              text: 'Main Title',
            },
            presentation: { alignment: 'left', spacing: 'normal' },
          },
          {
            id: 'p1',
            type: 'paragraph',
            content: {
              text: 'Section content here',
            },
            presentation: { alignment: 'left', spacing: 'normal' },
          },
          {
            id: 'h2-1',
            type: 'heading',
            content: {
              level: 2,
              text: 'Subsection',
            },
            presentation: { alignment: 'left', spacing: 'normal' },
          },
        ],
      };

      const result = service.analyzeDocument(document);

      expect(result.sectionOutline).toHaveLength(1); // 1 H1
      expect(result.sectionOutline[0]?.level).toBe('h1');
      expect(result.sectionOutline[0]?.title).toBe('Main Title');
      expect(result.sectionOutline[0]?.subsections).toHaveLength(1); // 1 H2 under H1
      expect(result.sectionOutline[0]?.subsections?.[0]?.level).toBe('h2');
    });

    it('should calculate section confidence', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result.sectionOutline[0]?.confidence).toBeGreaterThan(0);
      expect(result.sectionOutline[0]?.confidence).toBeLessThanOrEqual(100);
    });

    it('should extract section snippets', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result.sectionOutline[0]?.snippet).toBeTruthy();
      expect(result.sectionOutline[0]?.snippet.length).toBeLessThanOrEqual(100);
    });
  });

  describe('quality indicators', () => {
    it('should evaluate readability', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(['excellent', 'good', 'fair', 'poor']).toContain(
        result.qualityIndicators.readability
      );
    });

    it('should evaluate structure based on headings', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(['excellent', 'good', 'fair', 'poor']).toContain(
        result.qualityIndicators.structure
      );
    });

    it('should evaluate completeness based on word count', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(['excellent', 'good', 'fair', 'poor']).toContain(
        result.qualityIndicators.completeness
      );
    });

    it('should detect code presence', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(['excellent', 'good', 'fair', 'none']).toContain(
        result.qualityIndicators.codePresence
      );
    });
  });

  describe('element detection', () => {
    it('should count all element types', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result.detectedElements.headings).toBe(1);
      expect(result.detectedElements.paragraphs).toBe(1);
      expect(result.detectedElements.codeBlocks).toBe(1);
      expect(result.detectedElements.bulletLists).toBe(0);
      expect(result.detectedElements.numberedLists).toBe(0);
      expect(result.detectedElements.quotes).toBe(0);
      expect(result.detectedElements.tables).toBe(0);
      expect(result.detectedElements.callouts).toBe(0);
    });

    it('should detect list types separately', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        metadata: {
          tags: [],
          estimatedReadTime: 10,
          audience: 'beginner',
        },
        blocks: [
          {
            id: 'list-1',
            type: 'list',
            content: {
              style: 'unordered',
              items: [
                { text: 'Item 1' },
                { text: 'Item 2' },
              ],
            },
            presentation: {
              spacing: 'normal',
            },
          },
          {
            id: 'list-2',
            type: 'list',
            content: {
              style: 'ordered',
              items: [
                { text: 'Step 1' },
                { text: 'Step 2' },
              ],
            },
            presentation: {
              spacing: 'normal',
            },
          },
        ],
      };

      const result = service.analyzeDocument(document);

      expect(result.detectedElements.bulletLists).toBe(1);
      expect(result.detectedElements.numberedLists).toBe(1);
    });
  });

  describe('smart suggestions', () => {
    it('should generate suggestions array', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(Array.isArray(result.smartSuggestions)).toBe(true);
      expect(result.smartSuggestions.length).toBeGreaterThan(0);
    });

    it('should suggest improvements for poor structure', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        metadata: {
          tags: [],
          estimatedReadTime: 10,
          audience: 'beginner',
        },
        blocks: [
          {
            id: 'p1',
            type: 'paragraph',
            content: {
              text: 'Content without headings',
            },
            presentation: { alignment: 'left', spacing: 'normal' },
          },
        ],
      };

      const result = service.analyzeDocument(document);

      const hasSuggestion = result.smartSuggestions.some((s) =>
        s.text.toLowerCase().includes('heading')
      );
      expect(hasSuggestion).toBe(true);
    });

    it('should have valid suggestion structure', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      result.smartSuggestions.forEach((suggestion) => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('text');
        expect(suggestion).toHaveProperty('type');
        expect(['layout', 'component', 'callout', 'structure', 'general']).toContain(
          suggestion.type
        );
      });
    });
  });

  describe('overall confidence', () => {
    it('should calculate confidence score', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result.overallConfidence.score).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence.score).toBeLessThanOrEqual(100);
    });

    it('should assign appropriate grade', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(['Excellent', 'High', 'Good', 'Moderate', 'Low']).toContain(
        result.overallConfidence.grade
      );
    });

    it('should provide description', () => {
      const document = createSimpleDocument();
      const result = service.analyzeDocument(document);

      expect(result.overallConfidence.description).toBeTruthy();
      expect(result.overallConfidence.description!.length).toBeGreaterThan(0);
    });

    it('should give higher scores to rich documents', () => {
      const richDocument: TutorialDocument = {
        schemaVersion: 1,
        metadata: {
          tags: ['complete'],
          estimatedReadTime: 30,
          audience: 'intermediate',
        },
        blocks: [
          {
            id: 'h1-1',
            type: 'heading',
            content: {
              level: 1,
              text: 'Complete Tutorial',
            },
            presentation: { alignment: 'left', spacing: 'normal' },
          },
          {
            id: 'p1',
            type: 'paragraph',
            content: {
              text: 'This is a comprehensive tutorial with lots of content. It covers many topics in detail. The content is well-structured and easy to follow. We provide multiple examples throughout.',
            },
            presentation: { alignment: 'left', spacing: 'normal' },
          },
          {
            id: 'code-1',
            type: 'code',
            content: {
              language: 'javascript',
              code: 'const example = "code";',
              showLineNumbers: true,
            },
            presentation: { spacing: 'normal' },
          },
          {
            id: 'example-1',
            type: 'example',
            content: {
              title: 'Real Example',
              explanation: 'For example, consider this case...',
            },
            presentation: { spacing: 'normal' },
          },
          {
            id: 'callout-1',
            type: 'callout',
            content: {
              variant: 'info',
              title: 'Important Note',
              text: 'Remember this key point',
            },
            presentation: { spacing: 'normal' },
          },
          {
            id: 'table-1',
            type: 'table',
            content: {
              columns: [
                { id: 'col-1', label: 'Feature' },
                { id: 'col-2', label: 'Description' },
              ],
              rows: [
                { id: 'row-1', cells: [
                  { columnId: 'col-1', value: 'Feature 1' },
                  { columnId: 'col-2', value: 'Description 1' },
                ]},
              ],
              hasHeader: true,
            },
            presentation: { spacing: 'normal' },
          },
        ],
      };

      const result = service.analyzeDocument(richDocument);

      expect(result.overallConfidence.score).toBeGreaterThanOrEqual(50);
    });
  });
});
