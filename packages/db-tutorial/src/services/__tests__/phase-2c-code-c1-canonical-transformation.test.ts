/**
 * Phase 2C - Code C1 Canonical Transformation Tests
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
import { buildCanonicalCodeC1Block, buildCanonicalDefinitionD1Block } from '../canonical-block-builder';
import { buildTutorialDocument } from '../tutorial-document-builder';
import type { 
  CodeC1AuthorContent, 
  CodeC1Block,
  DefinitionD1AuthorContent,
  DefinitionD1Block,
} from '@quiz/types';

describe('Phase 2C - Code C1 Canonical Transformation', () => {
  const validAuthorContent: CodeC1AuthorContent = {
    page: {
      type: 'code',
      title: 'Python Print Statement',
      introduction: 'The print() function displays output to the console.',
      language: 'python',
      code: 'print("Hello, World!")',
      explanation: [
        {
          focus: 'print() function',
          description: 'Built-in function that outputs text to the console.',
        },
        {
          focus: 'String argument',
          description: 'The text "Hello, World!" is passed as a string.',
        },
      ],
      takeaway: 'Use print() to display output in Python.',
    },
  };

  describe('buildCanonicalCodeC1Block', () => {
    it('TEST 1 — should generate UUID when blockId not provided', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      
      expect(block.id).toBeTruthy();
      expect(typeof block.id).toBe('string');
      // UUID v4 format validation
      expect(block.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('TEST 2 — should accept provided blockId', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';
      const block = buildCanonicalCodeC1Block(validAuthorContent, customId);
      
      expect(block.id).toBe(customId);
    });

    it('TEST 3 — should set type to "code"', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      
      expect(block.type).toBe('code');
    });

    it('TEST 4 — should set version to "C1"', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      
      expect(block.version).toBe('C1');
    });

    it('TEST 5 — should preserve author content exactly', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      
      expect(block.content).toEqual(validAuthorContent);
      expect(block.content.page).toEqual(validAuthorContent.page);
    });

    it('TEST 6 — should not modify original author content', () => {
      const originalContent = JSON.parse(JSON.stringify(validAuthorContent));
      buildCanonicalCodeC1Block(validAuthorContent);
      
      expect(validAuthorContent).toEqual(originalContent);
    });

    it('TEST 7 — should not add hierarchy metadata to block', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent) as any;
      
      expect(block.domainId).toBeUndefined();
      expect(block.subjectId).toBeUndefined();
      expect(block.topicId).toBeUndefined();
      expect(block.subtopicId).toBeUndefined();
    });

    it('TEST 8 — should not add hierarchy metadata inside content', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent) as any;
      
      expect(block.content.domainId).toBeUndefined();
      expect(block.content.subjectId).toBeUndefined();
      expect(block.content.topicId).toBeUndefined();
      expect(block.content.subtopicId).toBeUndefined();
    });

    it('TEST 9 — should not add hierarchy metadata inside page', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent) as any;
      
      expect(block.content.page.domainId).toBeUndefined();
      expect(block.content.page.subjectId).toBeUndefined();
      expect(block.content.page.topicId).toBeUndefined();
      expect(block.content.page.subtopicId).toBeUndefined();
    });

    it('TEST 10 — should not add brand metadata', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent) as any;
      
      expect(block.brandId).toBeUndefined();
      expect(block.theme).toBeUndefined();
      expect(block.content.brandId).toBeUndefined();
      expect(block.content.theme).toBeUndefined();
    });

    it('TEST 11 — should not add schemaVersion to block', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent) as any;
      
      expect(block.schemaVersion).toBeUndefined();
    });

    it('TEST 12 — should preserve all required page fields', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      
      expect(block.content.page.type).toBe('code');
      expect(block.content.page.title).toBe('Python Print Statement');
      expect(block.content.page.introduction).toBe('The print() function displays output to the console.');
      expect(block.content.page.language).toBe('python');
      expect(block.content.page.code).toBe('print("Hello, World!")');
      expect(block.content.page.explanation).toEqual([
        {
          focus: 'print() function',
          description: 'Built-in function that outputs text to the console.',
        },
        {
          focus: 'String argument',
          description: 'The text "Hello, World!" is passed as a string.',
        },
      ]);
      expect(block.content.page.takeaway).toBe('Use print() to display output in Python.');
    });

    it('TEST 13 — should preserve optional filename field', () => {
      const contentWithFilename: CodeC1AuthorContent = {
        page: {
          ...validAuthorContent.page,
          filename: 'hello.py',
        },
      };
      
      const block = buildCanonicalCodeC1Block(contentWithFilename);
      
      expect(block.content.page.filename).toBe('hello.py');
    });

    it('TEST 14 — should preserve optional output field', () => {
      const contentWithOutput: CodeC1AuthorContent = {
        page: {
          ...validAuthorContent.page,
          output: {
            value: 'Hello, World!',
            description: 'The text is printed to the console.',
          },
        },
      };
      
      const block = buildCanonicalCodeC1Block(contentWithOutput);
      
      expect(block.content.page.output).toEqual({
        value: 'Hello, World!',
        description: 'The text is printed to the console.',
      });
    });

    it('TEST 15 — should preserve optional practiceHint field', () => {
      const contentWithHint: CodeC1AuthorContent = {
        page: {
          ...validAuthorContent.page,
          practiceHint: 'Try changing the message and running the code again.',
        },
      };
      
      const block = buildCanonicalCodeC1Block(contentWithHint);
      
      expect(block.content.page.practiceHint).toBe('Try changing the message and running the code again.');
    });

    it('TEST 16 — should generate different UUIDs for different blocks', () => {
      const block1 = buildCanonicalCodeC1Block(validAuthorContent);
      const block2 = buildCanonicalCodeC1Block(validAuthorContent);
      
      expect(block1.id).not.toBe(block2.id);
    });

    it('TEST 17 — should have correct TypeScript type', () => {
      const block: CodeC1Block = buildCanonicalCodeC1Block(validAuthorContent);
      
      // Type assertions - if these compile, types are correct
      expect(block.id).toBeTruthy();
      expect(block.type).toBe('code');
      expect(block.version).toBe('C1');
      expect(block.content.page.type).toBe('code');
    });
  });

  describe('buildTutorialDocument Integration', () => {
    it('TEST 18 — should create document with single C1 block', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      const document = buildTutorialDocument([block]);
      
      expect(document.schemaVersion).toBe(1);
      expect(document.blocks).toHaveLength(1);
      expect(document.blocks[0]).toEqual(block);
    });

    it('TEST 19 — should create document with multiple C1 blocks', () => {
      const block1 = buildCanonicalCodeC1Block(validAuthorContent);
      const block2 = buildCanonicalCodeC1Block(validAuthorContent);
      const block3 = buildCanonicalCodeC1Block(validAuthorContent);
      
      const document = buildTutorialDocument([block1, block2, block3]);
      
      expect(document.blocks).toHaveLength(3);
      expect(document.blocks[0]).toEqual(block1);
      expect(document.blocks[1]).toEqual(block2);
      expect(document.blocks[2]).toEqual(block3);
    });

    it('TEST 20 — should preserve block order', () => {
      const block1 = buildCanonicalCodeC1Block(validAuthorContent, 'block-1');
      const block2 = buildCanonicalCodeC1Block(validAuthorContent, 'block-2');
      const block3 = buildCanonicalCodeC1Block(validAuthorContent, 'block-3');
      
      const document = buildTutorialDocument([block1, block2, block3]);
      
      expect(document.blocks[0].id).toBe('block-1');
      expect(document.blocks[1].id).toBe('block-2');
      expect(document.blocks[2].id).toBe('block-3');
    });

    it('TEST 21 — should not modify original blocks array', () => {
      const block1 = buildCanonicalCodeC1Block(validAuthorContent);
      const block2 = buildCanonicalCodeC1Block(validAuthorContent);
      const originalBlocks = [block1, block2];
      const originalBlocksCopy = JSON.parse(JSON.stringify(originalBlocks));
      
      buildTutorialDocument(originalBlocks);
      
      expect(originalBlocks).toEqual(originalBlocksCopy);
    });
  });

  describe('Full Pipeline Integration', () => {
    it('TEST 22 — should transform AI output through full pipeline', () => {
      // Step 1: AI author content (already validated by Phase 2A)
      const authorContent = validAuthorContent;
      
      // Step 2: Build canonical block
      const block = buildCanonicalCodeC1Block(authorContent);
      
      // Step 3: Build document
      const document = buildTutorialDocument([block]);
      
      // Verify complete structure
      expect(document).toMatchObject({
        schemaVersion: 1,
        blocks: [
          {
            id: expect.any(String),
            type: 'code',
            version: 'C1',
            content: {
              page: {
                type: 'code',
                title: 'Python Print Statement',
                introduction: expect.any(String),
                language: 'python',
                code: expect.any(String),
                explanation: expect.any(Array),
                takeaway: expect.any(String),
              },
            },
          },
        ],
      });
    });

    it('TEST 23 — should support multiple C1 blocks in same document', () => {
      const authorContent1: CodeC1AuthorContent = {
        page: {
          ...validAuthorContent.page,
          title: 'First Code Example',
        },
      };
      
      const authorContent2: CodeC1AuthorContent = {
        page: {
          ...validAuthorContent.page,
          title: 'Second Code Example',
        },
      };
      
      const block1 = buildCanonicalCodeC1Block(authorContent1);
      const block2 = buildCanonicalCodeC1Block(authorContent2);
      
      const document = buildTutorialDocument([block1, block2]);
      
      expect(document.blocks).toHaveLength(2);
      
      // Type assertions for accessing C1-specific properties
      const c1Block1 = document.blocks[0] as CodeC1Block;
      const c1Block2 = document.blocks[1] as CodeC1Block;
      
      expect(c1Block1.content.page.title).toBe('First Code Example');
      expect(c1Block2.content.page.title).toBe('Second Code Example');
      expect(c1Block1.version).toBe('C1');
      expect(c1Block2.version).toBe('C1');
    });

    it('TEST 24 — should maintain content integrity through pipeline', () => {
      const originalContent = JSON.parse(JSON.stringify(validAuthorContent));
      
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      const document = buildTutorialDocument([block]);
      
      // Type assertion for accessing C1-specific properties
      const c1Block = document.blocks[0] as CodeC1Block;
      
      // Content should be identical to original
      expect(c1Block.content).toEqual(originalContent);
      expect(c1Block.content.page).toEqual(originalContent.page);
    });

    it('TEST 25 — should support mixed D1 and C1 blocks in document', () => {
      // This verifies that C1 blocks can coexist with D1 blocks
      // Phase 2A-compliant C1 fixture
      const c1Content: CodeC1AuthorContent = {
        page: {
          type: 'code',
          title: 'Python Variable Assignment',
          introduction: 'This example demonstrates how Python creates a variable and assigns a value to it using the assignment operator.',
          language: 'python',
          code: 'x = 1',
          explanation: [
            {
              focus: 'Variable assignment',
              description: 'The assignment operator stores the integer value 1 inside the variable named x.',
            },
            {
              focus: 'Variable name',
              description: 'The name x provides a reference that can be used to access the stored value later.',
            },
          ],
          takeaway: 'Variables allow programs to store and reuse values during execution, forming the foundation of data manipulation.',
        },
      };

      // Phase 2A-compliant D1 fixture
      const d1Content: DefinitionD1AuthorContent = {
        page: {
          type: 'definition',
          category: 'Programming Concepts',
          title: 'Variable',
          intro: 'Understanding variables in programming contexts.',
          definition: 'A named storage location that holds a value which can be changed during program execution.',
          explanation: [
            'Variables are created through assignment and do not require explicit type declarations in Python.',
            'Each variable has a name that serves as a reference to access the stored value.',
          ],
          example: {
            language: 'python',
            code: 'x = 42\nprint(x)',
          },
          characteristics: [
            {
              icon: '📦',
              title: 'Storage',
              description: 'Holds data values in memory for program use.',
            },
          ],
          takeaway: 'Variables provide named references to data, enabling programs to store and manipulate information.',
        },
      };
      
      const c1Block = buildCanonicalCodeC1Block(c1Content);
      const d1Block = buildCanonicalDefinitionD1Block(d1Content);
      const document = buildTutorialDocument([d1Block, c1Block]);
      
      expect(document.blocks).toHaveLength(2);
      expect(document.blocks[0].type).toBe('definition');
      expect((document.blocks[0] as DefinitionD1Block).version).toBe('D1');
      expect(document.blocks[1].type).toBe('code');
      expect((document.blocks[1] as CodeC1Block).version).toBe('C1');
    });
  });

  describe('Metadata Separation Verification', () => {
    it('TEST 26 — should prove blocks contain only content, not hierarchy', () => {
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      
      const blockKeys = Object.keys(block);
      expect(blockKeys).toEqual(['id', 'type', 'version', 'content']);
    });

    it('TEST 27 — should prove hierarchy stored separately (architecture)', () => {
      // Architecture verification:
      // Hierarchy (subtopicId) stored in tutorial_sections.subtopic_id column
      // NOT in the JSONB content field
      
      const block = buildCanonicalCodeC1Block(validAuthorContent);
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

    it('TEST 28 — should prove AI cannot inject system metadata', () => {
      // Security boundary verification:
      // AI provides { page: {...} }
      // System adds { id, type, version }
      
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      
      // System fields present
      expect(block.id).toBeTruthy();
      expect(block.type).toBe('code');
      expect(block.version).toBe('C1');
      
      // System fields NOT in author content
      expect((validAuthorContent as any).id).toBeUndefined();
      expect((validAuthorContent as any).type).toBeUndefined();
      expect((validAuthorContent as any).version).toBeUndefined();
    });

    it('TEST 29 — should prove system envelope is immutable', () => {
      const block1 = buildCanonicalCodeC1Block(validAuthorContent);
      const block2 = buildCanonicalCodeC1Block(validAuthorContent);
      
      // Type and version are always the same
      expect(block1.type).toBe('code');
      expect(block2.type).toBe('code');
      expect(block1.version).toBe('C1');
      expect(block2.version).toBe('C1');
      
      // Only id varies
      expect(block1.id).not.toBe(block2.id);
    });

    it('TEST 30 — should prove content is immutable (no mutation)', () => {
      const originalPage = JSON.parse(JSON.stringify(validAuthorContent.page));
      
      const block = buildCanonicalCodeC1Block(validAuthorContent);
      
      // Builder should NOT mutate content
      expect(block.content.page).toEqual(originalPage);
      expect(validAuthorContent.page).toEqual(originalPage);
    });

    it('TEST 31 — should prevent system metadata injection from reaching canonical block', () => {
      // Malicious input attempting to inject system-controlled fields
      const maliciousInput = {
        page: validAuthorContent.page,
        id: 'attacker-controlled-id',
        type: 'definition',
        version: 'C999',
        domainId: 'attacker-domain',
        subjectId: 'attacker-subject',
        topicId: 'attacker-topic',
        subtopicId: 'attacker-subtopic',
        brandId: 'attacker-brand',
        theme: 'attacker-theme',
        metadata: { malicious: true },
      } as any;
      
      // TypeScript accepts this at compile time because we cast to any
      // But at runtime, only validated CodeC1AuthorContent should be passed
      const block = buildCanonicalCodeC1Block(maliciousInput as CodeC1AuthorContent);
      
      // System envelope MUST be controlled by builder (sanitization, not rejection)
      expect(block.id).toBeTruthy();
      expect(block.id).not.toBe('attacker-controlled-id');
      expect(block.type).toBe('code');
      expect(block.version).toBe('C1');
      
      // Injected fields MUST NOT appear in block (excluded/sanitized)
      expect((block as any).domainId).toBeUndefined();
      expect((block as any).subjectId).toBeUndefined();
      expect((block as any).topicId).toBeUndefined();
      expect((block as any).subtopicId).toBeUndefined();
      expect((block as any).brandId).toBeUndefined();
      expect((block as any).theme).toBeUndefined();
      expect((block as any).metadata).toBeUndefined();
    });

    it('TEST 32 — should prevent injected content fields from reaching canonical block', () => {
      const maliciousContent = {
        page: validAuthorContent.page,
        domainId: 'injected',
        subjectId: 'injected',
      } as any;
      
      const block = buildCanonicalCodeC1Block(maliciousContent as CodeC1AuthorContent);
      
      // Content should only have page property (sanitization, not rejection)
      const contentKeys = Object.keys(block.content);
      expect(contentKeys).toEqual(['page']);
      
      // Injected fields should NOT leak through (excluded/sanitized)
      expect((block.content as any).domainId).toBeUndefined();
      expect((block.content as any).subjectId).toBeUndefined();
    });

    it('TEST 33 — should preserve explicit blockId without validating format', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const invalidUUID = 'not-a-uuid';
      
      // Valid UUID should be accepted
      const blockWithValidId = buildCanonicalCodeC1Block(validAuthorContent, validUUID);
      expect(blockWithValidId.id).toBe(validUUID);
      
      // Builder does not validate UUID format - accepts any string
      // UUID validation is the responsibility of the schema/trust boundary
      // before canonical transformation
      const blockWithInvalidId = buildCanonicalCodeC1Block(validAuthorContent, invalidUUID);
      expect(blockWithInvalidId.id).toBe(invalidUUID);
    });
  });
});
