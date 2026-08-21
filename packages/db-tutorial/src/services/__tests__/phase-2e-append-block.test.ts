/**
 * Phase 2E Tests - Append Block to Section
 * 
 * Tests the appendBlockToSection functionality that enables
 * multiple block instances in a single TutorialDocument
 */

import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { TutorialComposerService } from '../tutorial-composer.service';
import type { TutorialComposerServiceContext, CreateSectionInput } from '../tutorial-composer.service';
import type { TutorialDocument, TutorialBlock } from '@quiz/types';
import { TutorialDocumentValidationError, SectionNotFoundError } from '@quiz/types';
import { db } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { eq, inArray } from 'drizzle-orm';

describe('Phase 2E - Append Block to Section', () => {
  let service: TutorialComposerService;
  let context: TutorialComposerServiceContext;
  let testSubtopicId: string;
  let createdSectionIds: string[] = [];

  // REUSE Phase 2C's proven valid C1 fixture
  const baseValidC1Content = {
    page: {
      type: 'code' as const,
      title: 'Python Print Statement Example',
      introduction: 'The print() function displays output to the console in Python programs.',
      language: 'python' as const,
      code: 'print("Hello, World!")',
      explanation: [
        {
          focus: 'print() function',
          description: 'Built-in function that outputs text to the console for debugging and display.',
        },
        {
          focus: 'String argument',
          description: 'The text "Hello, World!" is passed as a string parameter to the function.',
        },
      ],
      takeaway: 'Use print() to display output in Python programs.',
    },
  };

  beforeAll(async () => {
    // REUSE Phase 1H pattern: get existing subtopic from test database
    const result = await db
      .select({ id: tutorialSubtopics.id })
      .from(tutorialSubtopics)
      .limit(1);

    if (result.length === 0) {
      throw new Error('No subtopics found in test database. Run seed script first.');
    }

    testSubtopicId = result[0].id;
    
    // Hard delete ALL existing sections for this subtopic to ensure clean slate
    await db
      .delete(tutorialSections)
      .where(eq(tutorialSections.subtopicId, testSubtopicId));
  });

  beforeEach(() => {
    service = new TutorialComposerService();
    context = {
      userId: 'test-user-phase-2e',
    };
    createdSectionIds = [];
  });

  afterEach(async () => {
    // Hard delete all sections created during tests
    // CRITICAL: Must use hard delete because unique constraint checks archived rows
    if (createdSectionIds.length > 0) {
      await db
        .delete(tutorialSections)
        .where(inArray(tutorialSections.id, createdSectionIds));
      createdSectionIds = [];
    }
  });

  /**
   * TEST 1: Add second block to existing section
   */
  it('TEST 1 — adds second block to existing section', async () => {
    // Create section with one D1 block
    const firstBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000001',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Python Fundamentals',
          title: 'What is a Variable?',
          intro: 'A variable is a named storage location in memory.',
          definition: 'A variable is a symbolic name that refers to an object stored in memory.',
          explanation: [
            'Variables store data that can be used throughout your program',
            'Variables can be reassigned to different values',
          ],
          example: {
            language: 'python',
            code: 'x = 10\nprint(x)',
          },
          characteristics: [
            { icon: '○', title: 'Named Reference', description: 'A variable is a name that refers to a value or object.' },
          ],
          takeaway: 'Use variables to store and reference data in your programs.',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [firstBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'notes', // notes allows both 'definition' and 'code' blocks
      difficulty: 'simple', // Unique difficulty for TEST 1
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup
    expect((section.content as TutorialDocument).blocks).toHaveLength(1);

    // Append second block
    const secondBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000002',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Variable Assignment Example',
          introduction: 'This example demonstrates basic variable assignment in Python',
          language: 'python',
          code: 'x = 10\nprint(x)',
          explanation: [
            { focus: 'x = 10', description: 'Assigns the value 10 to variable x' },
            { focus: 'print(x)', description: 'Outputs the value of x' },
          ],
          takeaway: 'Variables store values that can be used later',
        },
      },
    };

    const updated = await service.appendBlockToSection(section.id, secondBlock, context);

    expect((updated.content as TutorialDocument).blocks).toHaveLength(2);
    expect((updated.content as TutorialDocument).blocks[0].id).toBe('a0000000-0000-4000-8000-000000000001');
    expect((updated.content as TutorialDocument).blocks[1].id).toBe('a0000000-0000-4000-8000-000000000002');
  });

  /**
   * TEST 2: Add second Code C1 block (same type/version)
   */
  it('TEST 2 — adds second Code C1 block to section already containing Code C1', async () => {
    const firstCodeBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000003',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'First Code Example - Hello World Output',
          introduction: 'This is the first code example demonstrating basic console output in Python.',
          language: 'python',
          code: 'print("Hello")',
          explanation: [
            {
              focus: 'print() function',
              description: 'Built-in function for displaying output to the console in Python programs.',
            },
            {
              focus: '"Hello" string',
              description: 'String literal argument that will be displayed when the program executes.',
            },
          ],
          takeaway: 'Use the print function to output text messages to the console.',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [firstCodeBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'notes', // notes allows both 'definition' and 'code' blocks
      difficulty: 'mixed', // Unique difficulty for TEST 2
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup

    // Append second Code C1 block
    const secondCodeBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000004',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Python Print With Different Value',
          introduction: 'This second example demonstrates another practical use of the Python print function.',
          language: 'python',
          code: 'print("World")',
          explanation: [
            {
              focus: 'print() function',
              description: 'The same built-in output function can be called multiple times with different values.',
            },
            {
              focus: '"World" string',
              description: 'Different string value demonstrates that print accepts any string argument.',
            },
          ],
          takeaway: 'The print function can display different values and messages in Python programs.',
        },
      },
    };

    const updated = await service.appendBlockToSection(section.id, secondCodeBlock, context);

    const updatedBlocks = (updated.content as TutorialDocument).blocks;
    expect(updatedBlocks).toHaveLength(2);
    expect(updatedBlocks[0].type).toBe('code');
    expect(updatedBlocks[1].type).toBe('code');
    expect((updatedBlocks[0] as any).version).toBe('C1');
    expect((updatedBlocks[1] as any).version).toBe('C1');
    expect(updatedBlocks[0].id).not.toBe(updatedBlocks[1].id);
  });

  /**
   * TEST 3: Existing block content must remain unchanged
   */
  it('TEST 3 — existing block content remains unchanged after append', async () => {
    const originalBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000005',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Core Concepts',
          title: 'Original Title Concept',
          intro: 'This is the original block introduction with sufficient content.',
          definition: 'This is the original block definition with detailed explanation.',
          explanation: ['Original explanation with detailed content'],
          example: {
            language: 'python',
            code: 'original = True',
          },
          characteristics: [
            { icon: '○', title: 'Original', description: 'This is the original characteristic description.' },
          ],
          takeaway: 'Original takeaway message',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [originalBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'notes',
      difficulty: 'intermediate', // Unique for TEST 3
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup

    // Store original content for comparison
    const originalContent = JSON.parse(JSON.stringify((section.content as TutorialDocument).blocks[0].content));

    // Append new block
    const newBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000006',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'New Code Block Variable Assignment',
          introduction: 'This is a new code block demonstrating variable assignment and output in Python.',
          language: 'python',
          code: 'x = 20\nprint(x)',
          explanation: [
            {
              focus: 'x = 20 assignment',
              description: 'Variable assignment statement that stores the integer value 20 in variable x.',
            },
            {
              focus: 'print(x) output',
              description: 'Output statement that displays the current value stored in variable x.',
            },
          ],
          takeaway: 'Variables store values that can be displayed using the print function.',
        },
      },
    };

    const updated = await service.appendBlockToSection(section.id, newBlock, context);

    // Original block content must be identical
    expect((updated.content as TutorialDocument).blocks[0].id).toBe('a0000000-0000-4000-8000-000000000005');
    expect((updated.content as TutorialDocument).blocks[0].content).toEqual(originalContent);
  });

  /**
   * TEST 4: Existing block IDs must remain unchanged
   */
  it('TEST 4 — existing block IDs remain unchanged after append', async () => {
    const block1: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000007',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Fundamentals',
          title: 'Block 1 Concept Title',
          intro: 'First block introduction with enough detail.',
          definition: 'First block definition with comprehensive explanation.',
          explanation: ['Explanation 1 with detailed content'],
          example: {
            language: 'python',
            code: 'block1 = True',
          },
          characteristics: [
            { icon: '○', title: 'First', description: 'This is the first block characteristic.' },
          ],
          takeaway: 'Takeaway message for block 1',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [block1],
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'notes',
      difficulty: 'expert',
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup
    const originalBlockId = (section.content as TutorialDocument).blocks[0].id;

    // Append multiple blocks
    const block2: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000008',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Block 2 Code Example Variable Y',
          introduction: 'Second block introduction demonstrating variable assignment with detailed explanation.',
          language: 'python',
          code: 'y = 30\nprint(y)',
          explanation: [
            {
              focus: 'y = 30 assignment',
              description: 'Variable y is assigned the integer value 30 for later use in the program.',
            },
            {
              focus: 'print(y) statement',
              description: 'Output statement displays the current value stored in variable y to console.',
            },
          ],
          takeaway: 'Multiple variables can store different values independently in Python.',
        },
      },
    };

    const updated1 = await service.appendBlockToSection(section.id, block2, context);
    expect((updated1.content as TutorialDocument).blocks[0].id).toBe(originalBlockId);

    const block3: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000009',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Advanced',
          title: 'Block 3 Concept Title',
          intro: 'Third block introduction with comprehensive detail.',
          definition: 'Third block definition with thorough explanation.',
          explanation: ['Explanation 3 with detailed content'],
          example: {
            language: 'python',
            code: 'block3 = True',
          },
          characteristics: [
            { icon: '○', title: 'Third', description: 'This is the third block characteristic.' },
          ],
          takeaway: 'Takeaway message for block 3',
        },
      },
    };

    const updated2 = await service.appendBlockToSection(updated1.id, block3, context);
    expect((updated2.content as TutorialDocument).blocks[0].id).toBe(originalBlockId);
    expect((updated2.content as TutorialDocument).blocks[1].id).toBe('a0000000-0000-4000-8000-000000000008');
  });

  /**
   * TEST 5: Order must be preserved
   */
  it('TEST 5 — block order is preserved across multiple appends', async () => {
    const blockA: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-00000000000a',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Series A',
          title: 'Block A Concept Title',
          intro: 'Block A introduction with detailed information.',
          definition: 'Block A definition with comprehensive explanation.',
          explanation: ['Block A explanation with detailed content'],
          example: {
            language: 'python',
            code: 'a = True',
          },
          characteristics: [
            { icon: '○', title: 'A Char', description: 'This is block A characteristic description.' },
          ],
          takeaway: 'Block A takeaway message',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [blockA],
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'technical', // technical also allows 'definition' and 'code'
      difficulty: 'intermediate', // Unique combination for TEST 5
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup

    const blockB: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-00000000000b',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Block B Code Example Sequential Order',
          introduction: 'Block B introduction with detailed explanation demonstrating sequential code execution.',
          language: 'python',
          code: 'b = 1\nprint(b)',
          explanation: [
            {
              focus: 'b = 1 assignment',
              description: 'Variable B is assigned the value 1 as the first step in the sequence.',
            },
            {
              focus: 'print(b) output',
              description: 'Output statement displays the value of B to verify the assignment worked correctly.',
            },
          ],
          takeaway: 'Python executes statements sequentially from top to bottom in order.',
        },
      },
    };

    const updated1 = await service.appendBlockToSection(section.id, blockB, context);

    const blockC: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-00000000000c',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Series C',
          title: 'Block C Concept Title',
          intro: 'Block C introduction with comprehensive details.',
          definition: 'Block C definition with thorough explanation.',
          explanation: ['Block C explanation with detailed content'],
          example: {
            language: 'python',
            code: 'c = True',
          },
          characteristics: [
            { icon: '○', title: 'C Char', description: 'This is block C characteristic description.' },
          ],
          takeaway: 'Block C takeaway message',
        },
      },
    };

    const updated2 = await service.appendBlockToSection(updated1.id, blockC, context);

    expect((updated2.content as TutorialDocument).blocks).toHaveLength(3);
    expect((updated2.content as TutorialDocument).blocks[0].id).toBe('a0000000-0000-4000-8000-00000000000a');
    expect((updated2.content as TutorialDocument).blocks[1].id).toBe('a0000000-0000-4000-8000-00000000000b');
    expect((updated2.content as TutorialDocument).blocks[2].id).toBe('a0000000-0000-4000-8000-00000000000c');
  });

  /**
   * TEST 6: Add Definition D1 → Code C1 → Code C1 → Definition D1
   */
  it('TEST 6 — adds blocks in sequence: D1, C1, C1, D1', async () => {
    const d1First: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-00000000000d',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'First Definition',
          title: 'Definition 1 Concept',
          intro: 'First definition introduction with detailed information.',
          definition: 'First definition with comprehensive explanation of concept 1.',
          explanation: ['Explains concept 1 with detailed information'],
          example: {
            language: 'python',
            code: 'concept1 = True',
          },
          characteristics: [
            { icon: '○', title: 'Concept 1', description: 'First concept characteristic description.' },
          ],
          takeaway: 'Remember concept 1 key points',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [d1First],
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'technical', // technical also allows 'definition' and 'code'
      difficulty: 'simple', // Unique combination for TEST 6
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup

    const c1First: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-00000000000e',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Code Example 1 - Variable Declaration and Output',
          introduction: 'First code example showing variable declaration and console output in Python programs.',
          language: 'python',
          code: 'x = 10\nprint(x)',
          explanation: [
            {
              focus: 'x = 10 declaration',
              description: 'Variable x is assigned the integer value 10 for storage and later use.',
            },
            {
              focus: 'print(x) display',
              description: 'Output the value of x to demonstrate that the variable holds the assigned value.',
            },
          ],
          takeaway: 'Code example 1 demonstrates variable declaration and display in Python.',
        },
      },
    };

    const after1 = await service.appendBlockToSection(section.id, c1First, context);

    const c1Second: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-00000000000f',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Code Example 2 - Different Variable Assignment',
          introduction: 'Second code example with different variable to show multiple assignments work independently.',
          language: 'python',
          code: 'y = 20\nprint(y)',
          explanation: [
            {
              focus: 'y = 20 assignment',
              description: 'Variable y is assigned the integer value 20 independently from other variables.',
            },
            {
              focus: 'print(y) output',
              description: 'Output the value of y to demonstrate that each variable maintains its own value.',
            },
          ],
          takeaway: 'Code example 2 demonstrates that multiple variables work independently.',
        },
      },
    };

    const after2 = await service.appendBlockToSection(after1.id, c1Second, context);

    const d1Second: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000010',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Second Definition',
          title: 'Definition 2 Concept',
          intro: 'Second definition introduction with comprehensive details.',
          definition: 'Second definition with thorough explanation of concept 2.',
          explanation: ['Explains concept 2 with detailed information'],
          example: {
            language: 'python',
            code: 'concept2 = True',
          },
          characteristics: [
            { icon: '○', title: 'Concept 2', description: 'Second concept characteristic description.' },
          ],
          takeaway: 'Remember concept 2 key points',
        },
      },
    };

    const final = await service.appendBlockToSection(after2.id, d1Second, context);

    const finalBlocks = (final.content as TutorialDocument).blocks;
    expect(finalBlocks).toHaveLength(4);
    expect(finalBlocks[0].type).toBe('definition');
    expect((finalBlocks[0] as any).version).toBe('D1');
    expect(finalBlocks[1].type).toBe('code');
    expect((finalBlocks[1] as any).version).toBe('C1');
    expect(finalBlocks[2].type).toBe('code');
    expect((finalBlocks[2] as any).version).toBe('C1');
    expect(finalBlocks[3].type).toBe('definition');
    expect((finalBlocks[3] as any).version).toBe('D1');
  });

  /**
   * TEST 7: Adding a new block must NOT invoke createSection
   */
  it('TEST 7 — appending block does not create new section', async () => {
    const initialBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000011',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Initial Category',
          title: 'Initial Block Concept',
          intro: 'Initial block introduction with detailed information.',
          definition: 'Initial block definition with comprehensive explanation.',
          explanation: ['Initial block explanation with detailed content'],
          example: {
            language: 'python',
            code: 'initial = True',
          },
          characteristics: [
            { icon: '○', title: 'Initial', description: 'Initial block characteristic description.' },
          ],
          takeaway: 'Initial block takeaway message',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [initialBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'technical', // technical also allows 'definition' and 'code'
      difficulty: 'mixed', // Unique combination for TEST 7
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup
    const originalSectionId = section.id;

    // Append block
    const newBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000012',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Appended Code Block Variable Z',
          introduction: 'Appended block introduction with detailed explanation of variable assignment and output.',
          language: 'python',
          code: 'z = 99\nprint(z)',
          explanation: [
            {
              focus: 'z = 99 assignment',
              description: 'Variable z equals 99 demonstrating assignment of a larger integer value.',
            },
            {
              focus: 'print(z) display',
              description: 'Output z value to show the result of the assignment statement execution.',
            },
          ],
          takeaway: 'Appended blocks follow the same structure as initial blocks.',
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
      id: 'a0000000-0000-4000-8000-000000000013',
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Orphan Category',
          title: 'Orphan Block Title',
          intro: 'This is an orphan block introduction with enough content.',
          definition: 'This is the orphan block definition with sufficient detail to pass validation.',
          explanation: ['This is an orphan explanation'],
          example: {
            language: 'python',
            code: 'orphan = True',
          },
          characteristics: [
            { icon: '○', title: 'Orphan', description: 'This block has no section to append to.' },
          ],
          takeaway: 'Orphan blocks should throw SectionNotFoundError',
        },
      },
    };

    const nonExistentSectionId = '00000000-0000-4000-8000-000000000001';

    await expect(
      service.appendBlockToSection(nonExistentSectionId, block, context)
    ).rejects.toThrow(SectionNotFoundError);
  });

  /**
   * TEST 9: Validates appended block against section constraints
   */
  it('TEST 9 — validates appended block content against Phase 2A/2C schemas', async () => {
    const validBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000014',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Valid Code Block Example For Testing',
          introduction: 'Valid introduction with sufficient detail for validation and schema compliance testing.',
          language: 'python',
          code: 'print("valid")',
          explanation: [
            {
              focus: 'print function',
              description: 'Function description with enough characters to satisfy schema requirements.',
            },
            {
              focus: '"valid" string',
              description: 'String argument passed to the print function for output to console.',
            },
          ],
          takeaway: 'Valid takeaway message with sufficient character count for schema.',
        },
      },
    };

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: [validBlock],
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'technical', // technical also allows 'code'
      difficulty: 'expert', // Unique combination for TEST 9
      content: initialDocument,
    };

    const section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup

    // Try to append invalid C1 block (missing required explanation items)
    const invalidBlock: TutorialBlock = {
      id: 'a0000000-0000-4000-8000-000000000015',
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'x',  // Too short (min 10 chars)
          introduction: 'y',  // Too short (min 50 chars)
          language: 'python',
          code: 'x = 1',
          explanation: [
            { focus: 'x', description: 'short' },  // Only 1 item, needs 2+
          ],
          takeaway: 'z',  // Too short (min 20 chars)
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
        id: 'a0000000-0000-4000-8000-000000000016',
        type: 'definition',
        version: 'D1',
        content: {
          page: {
            type: 'definition',
            category: 'Render Test',
            title: 'Render Test 1 Concept',
            intro: 'First render test block introduction with details.',
            definition: 'First render test definition with explanation.',
            explanation: ['E1 explanation with detailed content'],
            example: {
              language: 'python',
              code: 'render1 = True',
            },
            characteristics: [
              { icon: '○', title: 'R1', description: 'Render test 1 characteristic.' },
            ],
            takeaway: 'T1 takeaway message',
          },
        },
      },
    ];

    const initialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks,
    };

    const createInput: CreateSectionInput = {
      subtopicId: testSubtopicId,
      sectionType: 'notes',
      difficulty: 'simple', // Will be cleaned up by afterEach before next test
      content: initialDocument,
    };

    let section = await service.createSection(createInput, context);
    createdSectionIds.push(section.id); // Track for cleanup

    const additionalBlocks: TutorialBlock[] = [
      {
        id: 'a0000000-0000-4000-8000-000000000017',
        type: 'code',
        version: 'C1',
        content: {
          page: {
            type: 'code',
            title: 'Render Test 2 Code Example',
            introduction: 'This second render test demonstrates a Python code example and shows how the resulting value is displayed.',
            language: 'python',
            code: 'a = 1\nprint(a)',
            explanation: [
              {
                focus: 'a = 1 assignment',
                description: 'Variable assignment statement that stores value 1 in variable a.',
              },
              {
                focus: 'print(a) output',
                description: 'Value output statement that displays the content of variable a.',
              },
            ],
            takeaway: 'This example demonstrates how Python executes the code and displays the resulting value.',
          },
        },
      },
      {
        id: 'a0000000-0000-4000-8000-000000000018',
        type: 'definition',
        version: 'D1',
        content: {
          page: {
            type: 'definition',
            category: 'Render Test',
            title: 'Render Test 3 Concept',
            intro: 'Third render test block introduction.',
            definition: 'Third render test definition.',
            explanation: ['E3 explanation content'],
            example: {
              language: 'python',
              code: 'render3 = True',
            },
            characteristics: [
              { icon: '○', title: 'R3', description: 'Render test 3 characteristic.' },
            ],
            takeaway: 'T3 takeaway message',
          },
        },
      },
    ];

    for (const block of additionalBlocks) {
      section = await service.appendBlockToSection(section.id, block, context);
    }

    // Document must contain all blocks in order
    expect((section.content as TutorialDocument).blocks).toHaveLength(3);
    expect((section.content as TutorialDocument).blocks.map((b) => b.id)).toEqual([
      'a0000000-0000-4000-8000-000000000016',
      'a0000000-0000-4000-8000-000000000017',
      'a0000000-0000-4000-8000-000000000018',
    ]);
  });
});


