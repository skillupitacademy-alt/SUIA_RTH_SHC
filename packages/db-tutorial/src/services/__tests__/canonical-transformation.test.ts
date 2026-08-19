/**
 * Phase 1G - Canonical Transformation Tests
 * 
 * Tests the transformation pipeline:
 * AI Output → Author Content → Canonical Block → Tutorial Document
 * 
 * CRITICAL BOUNDARIES TESTED:
 * - Block transformation preserves content exactly
 * - System generates/controls id, type, version
 * - Hierarchy NOT inside block content
 * - Document composition works with multiple blocks
 */

import { describe, it, expect } from 'vitest';
import { buildCanonicalDefinitionD1Block } from '../canonical-block-builder';
import { buildTutorialDocument } from '../tutorial-document-builder';
import type { DefinitionD1AuthorContent, DefinitionD1Block } from '@quiz/types';

describe('Phase 1G - Canonical Transformation', () => {
  const validAuthorContent: DefinitionD1AuthorContent = {
    page: {
      type: 'definition',
      category: 'Python Fundamentals',
      title: 'What Is a Variable?',
      intro: 'A variable is a name given to a value or object in memory.',
      definition: 'A variable is a symbolic name that refers to an object stored in memory.',
      explanation: [
        'Python binds a name to an object.',
        'The name can later refer to another object.',
      ],
      example: {
        language: 'python',
        code: 'x = 10\nprint(x)',
      },
      characteristics: [
        {
          icon: '○',
          title: 'Named Reference',
          description: 'A variable is a name that refers to an object.',
        },
      ],
      takeaway: 'A variable is a name that refers to an object in memory.',
    },
  };

  describe('buildCanonicalDefinitionD1Block', () => {
    it('should generate UUID when blockId not provided', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      expect(block.id).toBeTruthy();
      expect(typeof block.id).toBe('string');
      // UUID v4 format validation
      expect(block.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should accept provided blockId', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';
      const block = buildCanonicalDefinitionD1Block(validAuthorContent, customId);
      
      expect(block.id).toBe(customId);
    });

    it('should set type to "definition"', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      expect(block.type).toBe('definition');
    });

    it('should set version to "D1"', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      expect(block.version).toBe('D1');
    });

    it('should preserve author content exactly', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      expect(block.content).toEqual(validAuthorContent);
      expect(block.content.page).toEqual(validAuthorContent.page);
    });

    it('should not modify original author content', () => {
      const originalContent = JSON.parse(JSON.stringify(validAuthorContent));
      buildCanonicalDefinitionD1Block(validAuthorContent);
      
      expect(validAuthorContent).toEqual(originalContent);
    });

    it('should not add hierarchy metadata to block', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent) as any;
      
      expect(block.domainId).toBeUndefined();
      expect(block.subjectId).toBeUndefined();
      expect(block.topicId).toBeUndefined();
      expect(block.subtopicId).toBeUndefined();
    });

    it('should not add hierarchy metadata inside content', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent) as any;
      
      expect(block.content.domainId).toBeUndefined();
      expect(block.content.subjectId).toBeUndefined();
      expect(block.content.topicId).toBeUndefined();
      expect(block.content.subtopicId).toBeUndefined();
    });

    it('should not add hierarchy metadata inside page', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent) as any;
      
      expect(block.content.page.domainId).toBeUndefined();
      expect(block.content.page.subjectId).toBeUndefined();
      expect(block.content.page.topicId).toBeUndefined();
      expect(block.content.page.subtopicId).toBeUndefined();
    });

    it('should not add brand metadata', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent) as any;
      
      expect(block.brandId).toBeUndefined();
      expect(block.theme).toBeUndefined();
      expect(block.content.brandId).toBeUndefined();
      expect(block.content.theme).toBeUndefined();
    });

    it('should not add schemaVersion to block', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent) as any;
      
      expect(block.schemaVersion).toBeUndefined();
    });

    it('should preserve all page fields without modification', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      expect(block.content.page.type).toBe('definition');
      expect(block.content.page.category).toBe('Python Fundamentals');
      expect(block.content.page.title).toBe('What Is a Variable?');
      expect(block.content.page.intro).toBe('A variable is a name given to a value or object in memory.');
      expect(block.content.page.definition).toBe('A variable is a symbolic name that refers to an object stored in memory.');
      expect(block.content.page.explanation).toEqual([
        'Python binds a name to an object.',
        'The name can later refer to another object.',
      ]);
      expect(block.content.page.example).toEqual({
        language: 'python',
        code: 'x = 10\nprint(x)',
      });
      expect(block.content.page.characteristics).toEqual([
        {
          icon: '○',
          title: 'Named Reference',
          description: 'A variable is a name that refers to an object.',
        },
      ]);
      expect(block.content.page.takeaway).toBe('A variable is a name that refers to an object in memory.');
    });

    it('should generate different UUIDs for different blocks', () => {
      const block1 = buildCanonicalDefinitionD1Block(validAuthorContent);
      const block2 = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      expect(block1.id).not.toBe(block2.id);
    });

    it('should have correct TypeScript type', () => {
      const block: DefinitionD1Block = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      // Type assertions - if these compile, types are correct
      expect(block.id).toBeTruthy();
      expect(block.type).toBe('definition');
      expect(block.version).toBe('D1');
      expect(block.content.page.type).toBe('definition');
    });
  });

  describe('buildTutorialDocument', () => {
    it('should create document with single block', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block]);
      
      expect(document.schemaVersion).toBe(1);
      expect(document.blocks).toHaveLength(1);
      expect(document.blocks[0]).toEqual(block);
    });

    it('should create document with multiple blocks', () => {
      const block1 = buildCanonicalDefinitionD1Block(validAuthorContent);
      const block2 = buildCanonicalDefinitionD1Block(validAuthorContent);
      const block3 = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      const document = buildTutorialDocument([block1, block2, block3]);
      
      expect(document.blocks).toHaveLength(3);
      expect(document.blocks[0]).toEqual(block1);
      expect(document.blocks[1]).toEqual(block2);
      expect(document.blocks[2]).toEqual(block3);
    });

    it('should preserve block order', () => {
      const block1 = buildCanonicalDefinitionD1Block(validAuthorContent, 'block-1');
      const block2 = buildCanonicalDefinitionD1Block(validAuthorContent, 'block-2');
      const block3 = buildCanonicalDefinitionD1Block(validAuthorContent, 'block-3');
      
      const document = buildTutorialDocument([block1, block2, block3]);
      
      expect(document.blocks[0].id).toBe('block-1');
      expect(document.blocks[1].id).toBe('block-2');
      expect(document.blocks[2].id).toBe('block-3');
    });

    it('should set schemaVersion to 1', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block]);
      
      expect(document.schemaVersion).toBe(1);
    });

    it('should not add metadata when not provided', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block]);
      
      expect(document.metadata).toBeUndefined();
    });

    it('should include metadata when provided', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const metadata = {
        estimatedReadTime: 5,
        learningObjectives: ['Understand variables', 'Use variables in code'],
        tags: ['python', 'variables', 'fundamentals'],
      };
      
      const document = buildTutorialDocument([block], metadata);
      
      expect(document.metadata).toEqual(metadata);
    });

    it('should not add hierarchy to document', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block]) as any;
      
      expect(document.domainId).toBeUndefined();
      expect(document.subjectId).toBeUndefined();
      expect(document.topicId).toBeUndefined();
      expect(document.subtopicId).toBeUndefined();
    });

    it('should not add hierarchy to metadata', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const metadata = {
        estimatedReadTime: 5,
      };
      const document = buildTutorialDocument([block], metadata) as any;
      
      expect(document.metadata.domainId).toBeUndefined();
      expect(document.metadata.subjectId).toBeUndefined();
      expect(document.metadata.topicId).toBeUndefined();
      expect(document.metadata.subtopicId).toBeUndefined();
    });

    it('should not add brand/theme to document', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block]) as any;
      
      expect(document.brandId).toBeUndefined();
      expect(document.theme).toBeUndefined();
    });

    it('should handle empty blocks array', () => {
      const document = buildTutorialDocument([]);
      
      expect(document.schemaVersion).toBe(1);
      expect(document.blocks).toEqual([]);
    });

    it('should not modify original blocks array', () => {
      const block1 = buildCanonicalDefinitionD1Block(validAuthorContent);
      const block2 = buildCanonicalDefinitionD1Block(validAuthorContent);
      const originalBlocks = [block1, block2];
      const originalBlocksCopy = JSON.parse(JSON.stringify(originalBlocks));
      
      buildTutorialDocument(originalBlocks);
      
      expect(originalBlocks).toEqual(originalBlocksCopy);
    });
  });

  describe('Full Pipeline Integration', () => {
    it('should transform AI output through full pipeline', () => {
      // Step 1: AI author content (already validated by Phase 1F)
      const authorContent = validAuthorContent;
      
      // Step 2: Build canonical block
      const block = buildCanonicalDefinitionD1Block(authorContent);
      
      // Step 3: Build document
      const document = buildTutorialDocument([block]);
      
      // Verify complete structure
      expect(document).toMatchObject({
        schemaVersion: 1,
        blocks: [
          {
            id: expect.any(String),
            type: 'definition',
            version: 'D1',
            content: {
              page: {
                type: 'definition',
                category: 'Python Fundamentals',
                title: 'What Is a Variable?',
                intro: expect.any(String),
                definition: expect.any(String),
                explanation: expect.any(Array),
                example: expect.any(Object),
                characteristics: expect.any(Array),
                takeaway: expect.any(String),
              },
            },
          },
        ],
      });
    });

    it('should support multiple D1 blocks in same document', () => {
      const authorContent1: DefinitionD1AuthorContent = {
        page: {
          ...validAuthorContent.page,
          title: 'First Definition',
        },
      };
      
      const authorContent2: DefinitionD1AuthorContent = {
        page: {
          ...validAuthorContent.page,
          title: 'Second Definition',
        },
      };
      
      const block1 = buildCanonicalDefinitionD1Block(authorContent1);
      const block2 = buildCanonicalDefinitionD1Block(authorContent2);
      
      const document = buildTutorialDocument([block1, block2]);
      
      expect(document.blocks).toHaveLength(2);
      
      // Type assertions for accessing D1-specific properties
      const d1Block1 = document.blocks[0] as DefinitionD1Block;
      const d1Block2 = document.blocks[1] as DefinitionD1Block;
      
      expect(d1Block1.content.page.title).toBe('First Definition');
      expect(d1Block2.content.page.title).toBe('Second Definition');
      expect(d1Block1.version).toBe('D1');
      expect(d1Block2.version).toBe('D1');
    });

    it('should maintain content integrity through pipeline', () => {
      const originalContent = JSON.parse(JSON.stringify(validAuthorContent));
      
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block]);
      
      // Type assertion for accessing D1-specific properties
      const d1Block = document.blocks[0] as DefinitionD1Block;
      
      // Content should be identical to original
      expect(d1Block.content).toEqual(originalContent);
      expect(d1Block.content.page).toEqual(originalContent.page);
    });
  });

  describe('Metadata Separation Verification', () => {
    it('should prove blocks contain only content, not hierarchy', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      
      const blockKeys = Object.keys(block);
      expect(blockKeys).toEqual(['id', 'type', 'version', 'content']);
    });

    it('should prove document contains only schemaVersion, blocks, metadata', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block]);
      
      const documentKeys = Object.keys(document).sort();
      expect(documentKeys).toEqual(['blocks', 'schemaVersion']);
    });

    it('should prove document with metadata contains only schemaVersion, blocks, metadata', () => {
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block], { estimatedReadTime: 5 });
      
      const documentKeys = Object.keys(document).sort();
      expect(documentKeys).toEqual(['blocks', 'metadata', 'schemaVersion']);
    });

    it('should prove hierarchy stored separately in table column (architecture verification)', () => {
      // This test documents the architecture decision:
      // Hierarchy (subtopicId) is stored in tutorial_sections.subtopic_id column
      // NOT in the JSONB content field
      
      const block = buildCanonicalDefinitionD1Block(validAuthorContent);
      const document = buildTutorialDocument([block]);
      
      // Hierarchy should NOT be in document
      const documentJSON = JSON.stringify(document);
      expect(documentJSON).not.toContain('subtopicId');
      expect(documentJSON).not.toContain('topicId');
      expect(documentJSON).not.toContain('subjectId');
      expect(documentJSON).not.toContain('domainId');
      
      // Document only contains: schemaVersion, blocks
      expect(document).toHaveProperty('schemaVersion');
      expect(document).toHaveProperty('blocks');
      expect(document).not.toHaveProperty('subtopicId');
    });
  });
});
