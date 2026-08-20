/**
 * Phase 2E Tests - Append Block to Section
 * 
 * Tests the appendBlockToSection functionality that enables
 * multiple block instances in a single TutorialDocument
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialComposerService } from '../tutorial-composer.service';
import type { TutorialComposerServiceContext, CreateSectionInput } from '../tutorial-composer.service';
import type { TutorialDocument, TutorialBlock } from '@quiz/types';
import { TutorialDocumentValidationError, SectionNotFoundError } from '@quiz/types';
import { buildCanonicalDefinitionD1Block } from '../canonical-block-builder';
import { buildCanonicalCodeC1Block } from '../canonical-block-builder';
import type { DefinitionD1AuthorContent, CodeC1AuthorContent } from '@quiz/types';

describe('Phase 2E - Append Block to Section', () => {
  let service: TutorialComposerService;
  let context: TutorialComposerServiceContext;

  beforeEach(() => {
    service = new TutorialComposerService();
    context = {
      userId: 'test-user-phase-2e',
    };
  });

  /**
   * TEST 1: Add second block to existing section
   */
  it('TEST 1 — adds second block to existing section', async () => {
    // Create section with one D1 block
    const firstBlock: TutorialBlock = {
      id: 'block-d1-001',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'What is a Variable?',
        introduction: 'A variable is a named storage location.',
        explanation: [
          'Variables store data',
          'Variables can be reassigned',
        ],
        takeaway: 'Use variables to store data.',
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [firstBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-01',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    expect(section.content.blocks).toHaveLength(1);

    // Append second block
    const secondBlock: TutorialBlock = {
      id: 'block-c1-001',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Variable Assignment',
          introduction: 'Example of variable assignment',
          language: 'python',
          code: 'x = 10',
          explanation: [
            { focus: 'x = 10', description: 'Assigns 10 to x' },
            { focus: 'x', description: 'Variable name' },
          ],
          takeaway: 'Variables store values',
        },
      },
    };

    const updated = await service.appendBlockToSection(section.id, secondBlock, context);

    expect(updated.content.blocks).toHaveLength(2);
    expect(updated.content.blocks[0].id).toBe('block-d1-001');
    expect(updated.content.blocks[1].id).toBe('block-c1-001');
  });

  /**
   * TEST 2: Add second Code C1 block (same type/version)
   */
  it('TEST 2 — adds second Code C1 block to section already containing Code C1', async () => {
    const firstCodeBlock: TutorialBlock = {
      id: 'block-c1-alpha',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'First Code Example',
          introduction: 'First example',
          language: 'python',
          code: 'print("Hello")',
          explanation: [
            { focus: 'print', description: 'Output function' },
            { focus: '"Hello"', description: 'String argument' },
          ],
          takeaway: 'Use print to output',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [firstCodeBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-02',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);

    // Append second Code C1 block
    const secondCodeBlock: TutorialBlock = {
      id: 'block-c1-beta',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Second Code Example',
          introduction: 'Second example',
          language: 'python',
          code: 'print("World")',
          explanation: [
            { focus: 'print', description: 'Output function' },
            { focus: '"World"', description: 'Different string' },
          ],
          takeaway: 'Print different values',
        },
      },
    };

    const updated = await service.appendBlockToSection(section.id, secondCodeBlock, context);

    expect(updated.content.blocks).toHaveLength(2);
    expect(updated.content.blocks[0].type).toBe('code');
    expect(updated.content.blocks[1].type).toBe('code');
    expect(updated.content.blocks[0].version).toBe('C1');
    expect(updated.content.blocks[1].version).toBe('C1');
    expect(updated.content.blocks[0].id).not.toBe(updated.content.blocks[1].id);
  });

  /**
   * TEST 3: Existing block content must remain unchanged
   */
  it('TEST 3 — existing block content remains unchanged after append', async () => {
    const originalBlock: TutorialBlock = {
      id: 'block-original',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'Original Title',
        introduction: 'Original intro',
        explanation: ['Original explanation'],
        takeaway: 'Original takeaway',
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [originalBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-03',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);

    // Store original content for comparison
    const originalContent = JSON.parse(JSON.stringify(section.content.blocks[0].content));

    // Append new block
    const newBlock: TutorialBlock = {
      id: 'block-new',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'New Code',
          introduction: 'New intro',
          language: 'python',
          code: 'x = 20',
          explanation: [
            { focus: 'x', description: 'Variable' },
            { focus: '20', description: 'Value' },
          ],
          takeaway: 'New takeaway',
        },
      },
    };

    const updated = await service.appendBlockToSection(section.id, newBlock, context);

    // Original block content must be identical
    expect(updated.content.blocks[0].id).toBe('block-original');
    expect(updated.content.blocks[0].content).toEqual(originalContent);
  });

  /**
   * TEST 4: Existing block IDs must remain unchanged
   */
  it('TEST 4 — existing block IDs remain unchanged after append', async () => {
    const block1: TutorialBlock = {
      id: 'stable-id-001',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'Block 1',
        introduction: 'First block',
        explanation: ['Explanation 1'],
        takeaway: 'Takeaway 1',
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [block1],
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-04',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    const originalBlockId = section.content.blocks[0].id;

    // Append multiple blocks
    const block2: TutorialBlock = {
      id: 'stable-id-002',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Block 2',
          introduction: 'Second block',
          language: 'python',
          code: 'y = 30',
          explanation: [
            { focus: 'y', description: 'Variable y' },
            { focus: '30', description: 'Value 30' },
          ],
          takeaway: 'Takeaway 2',
        },
      },
    };

    const updated1 = await service.appendBlockToSection(section.id, block2, context);
    expect(updated1.content.blocks[0].id).toBe(originalBlockId);

    const block3: TutorialBlock = {
      id: 'stable-id-003',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'Block 3',
        introduction: 'Third block',
        explanation: ['Explanation 3'],
        takeaway: 'Takeaway 3',
      },
    };

    const updated2 = await service.appendBlockToSection(updated1.id, block3, context);
    expect(updated2.content.blocks[0].id).toBe(originalBlockId);
    expect(updated2.content.blocks[1].id).toBe('stable-id-002');
  });

  /**
   * TEST 5: Order must be preserved
   */
  it('TEST 5 — block order is preserved across multiple appends', async () => {
    const blockA: TutorialBlock = {
      id: 'block-a',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'A',
        introduction: 'Block A',
        explanation: ['A'],
        takeaway: 'A',
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [blockA],
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-05',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);

    const blockB: TutorialBlock = {
      id: 'block-b',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'B',
          introduction: 'Block B',
          language: 'python',
          code: 'b = 1',
          explanation: [
            { focus: 'b', description: 'B var' },
            { focus: '1', description: 'Value' },
          ],
          takeaway: 'B',
        },
      },
    };

    const updated1 = await service.appendBlockToSection(section.id, blockB, context);

    const blockC: TutorialBlock = {
      id: 'block-c',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'C',
        introduction: 'Block C',
        explanation: ['C'],
        takeaway: 'C',
      },
    };

    const updated2 = await service.appendBlockToSection(updated1.id, blockC, context);

    expect(updated2.content.blocks).toHaveLength(3);
    expect(updated2.content.blocks[0].id).toBe('block-a');
    expect(updated2.content.blocks[1].id).toBe('block-b');
    expect(updated2.content.blocks[2].id).toBe('block-c');
  });

  /**
   * TEST 6: Add Definition D1 → Code C1 → Code C1 → Definition D1
   */
  it('TEST 6 — adds blocks in sequence: D1, C1, C1, D1', async () => {
    const d1First: TutorialBlock = {
      id: 'def-1',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'Definition 1',
        introduction: 'First definition',
        explanation: ['Explains concept 1'],
        takeaway: 'Remember concept 1',
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [d1First],
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-06',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);

    const c1First: TutorialBlock = {
      id: 'code-1',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Code Example 1',
          introduction: 'First code',
          language: 'python',
          code: 'x = 10',
          explanation: [
            { focus: 'x', description: 'Variable x' },
            { focus: '10', description: 'Value 10' },
          ],
          takeaway: 'Code 1 takeaway',
        },
      },
    };

    const after1 = await service.appendBlockToSection(section.id, c1First, context);

    const c1Second: TutorialBlock = {
      id: 'code-2',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Code Example 2',
          introduction: 'Second code',
          language: 'python',
          code: 'y = 20',
          explanation: [
            { focus: 'y', description: 'Variable y' },
            { focus: '20', description: 'Value 20' },
          ],
          takeaway: 'Code 2 takeaway',
        },
      },
    };

    const after2 = await service.appendBlockToSection(after1.id, c1Second, context);

    const d1Second: TutorialBlock = {
      id: 'def-2',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'Definition 2',
        introduction: 'Second definition',
        explanation: ['Explains concept 2'],
        takeaway: 'Remember concept 2',
      },
    };

    const final = await service.appendBlockToSection(after2.id, d1Second, context);

    expect(final.content.blocks).toHaveLength(4);
    expect(final.content.blocks[0].type).toBe('definition');
    expect(final.content.blocks[0].version).toBe('D1');
    expect(final.content.blocks[1].type).toBe('code');
    expect(final.content.blocks[1].version).toBe('C1');
    expect(final.content.blocks[2].type).toBe('code');
    expect(final.content.blocks[2].version).toBe('C1');
    expect(final.content.blocks[3].type).toBe('definition');
    expect(final.content.blocks[3].version).toBe('D1');
  });

  /**
   * TEST 7: Adding a new block must NOT invoke createSection
   */
  it('TEST 7 — appending block does not create new section', async () => {
    const initialBlock: TutorialBlock = {
      id: 'initial-block',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'Initial',
        introduction: 'Initial block',
        explanation: ['Initial'],
        takeaway: 'Initial',
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [initialBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-07',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    const originalSectionId = section.id;

    // Append block
    const newBlock: TutorialBlock = {
      id: 'appended-block',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Appended',
          introduction: 'Appended block',
          language: 'python',
          code: 'z = 99',
          explanation: [
            { focus: 'z', description: 'Variable z' },
            { focus: '99', description: 'Value 99' },
          ],
          takeaway: 'Appended',
        },
      },
    };

    const updated = await service.appendBlockToSection(section.id, newBlock, context);

    // Must be same section
    expect(updated.id).toBe(originalSectionId);

    // Verify no duplicate section was created
    const existingSection = await service.getSectionByKey(
      createInput.subtopicId,
      createInput.sectionType,
      createInput.difficulty
    );

    expect(existingSection).not.toBeNull();
    expect(existingSection!.id).toBe(originalSectionId);
  });

  /**
   * TEST 8: Throws error when section not found
   */
  it('TEST 8 — throws SectionNotFoundError when appending to non-existent section', async () => {
    const block: TutorialBlock = {
      id: 'orphan-block',
      type: 'definition',
      version: 'D1',
      content: {
        title: 'Orphan',
        introduction: 'Orphan block',
        explanation: ['Orphan'],
        takeaway: 'Orphan',
      },
    };

    await expect(
      service.appendBlockToSection('non-existent-section-id', block, context)
    ).rejects.toThrow(SectionNotFoundError);
  });

  /**
   * TEST 9: Validates appended block against section constraints
   */
  it('TEST 9 — validates appended block content against Phase 2A/2C schemas', async () => {
    const validBlock: TutorialBlock = {
      id: 'valid-c1',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Valid Code',
          introduction: 'Valid introduction',
          language: 'python',
          code: 'print("valid")',
          explanation: [
            { focus: 'print', description: 'Function' },
            { focus: '"valid"', description: 'String' },
          ],
          takeaway: 'Valid takeaway',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [validBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-09',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);

    // Try to append invalid C1 block (missing required explanation items)
    const invalidBlock: TutorialBlock = {
      id: 'invalid-c1',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'x',  // Too short
          introduction: 'y',  // Too short
          language: 'python',
          code: 'x = 1',
          explanation: [
            { focus: 'x', description: 'short' },  // Only 1 item, needs 2+
          ],
          takeaway: 'z',  // Too short
        },
      },
    };

    await expect(
      service.appendBlockToSection(section.id, invalidBlock, context)
    ).rejects.toThrow(TutorialDocumentValidationError);
  });

  /**
   * TEST 10: Complete document preview renders all blocks
   */
  it('TEST 10 — document contains all appended blocks for rendering', async () => {
    const blocks: TutorialBlock[] = [
      {
        id: 'render-1',
        type: 'definition',
        version: 'D1',
        content: {
          title: 'Render Test 1',
          introduction: 'First',
          explanation: ['E1'],
          takeaway: 'T1',
        },
      },
    ];

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks,
    };

    const createInput: CreateSectionInput = {
      subtopicId: 'test-subtopic-2e-10',
      sectionType: 'notes',
      difficulty: 'intermediate',
      content: initialDocument,
    };

    let section = await service.createSection(createInput, context);

    const additionalBlocks: TutorialBlock[] = [
      {
        id: 'render-2',
        type: 'code',
        version: 'C1',
        content: {
          page: {
            type: 'code',
            title: 'Render Test 2',
            introduction: 'Second',
            language: 'python',
            code: 'a = 1',
            explanation: [
              { focus: 'a', description: 'Var' },
              { focus: '1', description: 'Val' },
            ],
            takeaway: 'T2',
          },
        },
      },
      {
        id: 'render-3',
        type: 'definition',
        version: 'D1',
        content: {
          title: 'Render Test 3',
          introduction: 'Third',
          explanation: ['E3'],
          takeaway: 'T3',
        },
      },
    ];

    for (const block of additionalBlocks) {
      section = await service.appendBlockToSection(section.id, block, context);
    }

    // Document must contain all blocks in order
    expect(section.content.blocks).toHaveLength(3);
    expect(section.content.blocks.map(b => b.id)).toEqual([
      'render-1',
      'render-2',
      'render-3',
    ]);
  });
});
