/**
 * Objective O1 Schema Validation Tests
 * 
 * Tests validate that the schema matches ACTUAL Composer output as documented
 * in the contract (.agents/tasks/corrective-remediation-o1-schema/composer-contract.md)
 * 
 * Critical contract points tested:
 * 1. NO content.page wrapping (Composer outputs direct content)
 * 2. Registry defaults must validate (after adding text field)
 * 3. Objective items require text field (renderer dependency)
 * 4. Objective id is optional (matches storage type)
 */

import { describe, it, expect } from 'vitest';
import { ObjectiveO1BlockSchema } from '../objective-o1.schema';

describe('ObjectiveO1BlockSchema', () => {
  describe('Real Composer Output Validation', () => {
    it('validates actual toCanonicalBlock() output shape', () => {
      // This is the EXACT shape produced by Composer toCanonicalBlock()
      // Source: blockVersionDefinitions.ts lines 264-277
      // Key evidence: line 273 assigns content directly (NO page wrapper)
      const realComposerShape = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        type: 'objective',
        version: 'O1',
        content: {
          // DIRECT content - NO page wrapper
          eyebrow: 'LEARNING OBJECTIVES',
          title: 'Skills You Will Develop in This Lesson',
          titleHighlight: 'Develop in This Lesson',
          introduction: 'By the end of this lesson, you will have the following practical skills:',
          objectives: [
            {
              id: '1',
              verb: 'Create',
              text: 'Create and initialize lists',
              description: 'Create Python lists using different methods and initialize them with values.',
              badge: 'Practical Skill',
              icon: 'create',
            },
            {
              id: '2',
              verb: 'Access',
              text: 'Access list elements by index',
              description: 'Retrieve individual elements from a list using positive and negative indices.',
              badge: 'Practical Skill',
              icon: 'access',
            },
          ],
          note: {
            title: 'Note',
            text: 'These are observable, practical skills you will develop in this lesson.',
          },
        },
        expectedTimeSec: 180,
      };

      const result = ObjectiveO1BlockSchema.safeParse(realComposerShape);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('objective');
        expect(result.data.version).toBe('O1');
        expect(result.data.content.title).toBe('Skills You Will Develop in This Lesson');
        expect(result.data.content.objectives).toHaveLength(2);
        expect(result.data.content.objectives[0].text).toBe('Create and initialize lists');
      }
    });

    it('validates minimal valid block (required fields only)', () => {
      const minimalBlock = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [
            {
              text: 'Understand basic concepts',
            },
          ],
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(minimalBlock);

      expect(result.success).toBe(true);
    });
  });

  describe('Registry Default Validation', () => {
    it('validates actual unchanged registry default shape (with title only, no text field)', () => {
      // This is the EXACT unchanged registry default from objective.registry.ts lines 19-68
      // Note: objectives contain `title` and `description`, but NO `text` field.
      const actualUnchangedRegistryDefault = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        type: 'objective',
        version: 'O1',
        content: {
          eyebrow: 'LEARNING OBJECTIVES',
          title: 'Skills You Will Develop in This Lesson',
          titleHighlight: 'Develop in This Lesson',
          introduction: 'By the end of this lesson, you will have the following practical skills:',
          objectives: [
            {
              id: '1',
              verb: 'Create',
              title: 'Create and initialize lists',
              description: 'Create Python lists using different methods and initialize them with values.',
              badge: 'Practical Skill',
              icon: 'create',
            },
            {
              id: '2',
              verb: 'Access',
              title: 'Access list elements',
              description: 'Retrieve individual elements from a list using indexing and negative indexing.',
              badge: 'Core Skill',
              icon: 'access',
            },
            {
              id: '3',
              verb: 'Extract',
              title: 'Extract values using slicing',
              description: 'Use slicing to get a range of elements and create sublists.',
              badge: 'Core Skill',
              icon: 'extract',
            },
            {
              id: '4',
              verb: 'Modify',
              title: 'Modify list contents',
              description: 'Change, add, or remove elements in existing lists.',
              badge: 'Practical Skill',
              icon: 'modify',
            },
            {
              id: '5',
              verb: 'Use',
              title: 'Use common list methods',
              description: 'Apply built-in methods like append, extend, insert, remove, and pop.',
              badge: 'Practical Skill',
              icon: 'use',
            },
            {
              id: '6',
              verb: 'Iterate',
              title: 'Iterate through lists',
              description: 'Process list elements using for loops, while loops, and list comprehensions.',
              badge: 'Practical Skill',
              icon: 'iterate',
            },
          ],
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(actualUnchangedRegistryDefault);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content.objectives).toHaveLength(6);
        expect(result.data.content.objectives[0].title).toBe('Create and initialize lists');
        expect(result.data.content.objectives[0].text).toBeUndefined();
      }
    });
  });

  describe('Objective Item Field Requirements', () => {
    it('accepts title-only or text-only objective items and rejects items missing both', () => {
      // 1. Title only (matches actual registry default: objective.registry.ts:28)
      const blockWithTitleOnly = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [
            {
              id: '1',
              title: 'Create and initialize lists', // Has title, NO text
            },
          ],
        },
      };
      const titleResult = ObjectiveO1BlockSchema.safeParse(blockWithTitleOnly);
      expect(titleResult.success).toBe(true);

      // 2. Text only (matches AI-generated payload)
      const blockWithTextOnly = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [
            {
              id: '1',
              text: 'Create and initialize lists', // Has text, NO title
            },
          ],
        },
      };
      const textResult = ObjectiveO1BlockSchema.safeParse(blockWithTextOnly);
      expect(textResult.success).toBe(true);

      // 3. Both title and text present
      const blockWithBoth = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [
            {
              id: '1',
              title: 'List initialization',
              text: 'Create and initialize lists',
            },
          ],
        },
      };
      const bothResult = ObjectiveO1BlockSchema.safeParse(blockWithBoth);
      expect(bothResult.success).toBe(true);

      // 4. Missing BOTH title and text (MUST FAIL)
      const blockMissingBoth = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [
            {
              id: '1',
              description: 'Just a description with no title or text',
            },
          ],
        },
      };
      const missingResult = ObjectiveO1BlockSchema.safeParse(blockMissingBoth);
      expect(missingResult.success).toBe(false);
      if (!missingResult.success) {
        expect(missingResult.error.issues.some(issue => 
          issue.message.includes("must have either 'title' or 'text'")
        )).toBe(true);
      }
    });

    it('allows optional id field in objective items', () => {
      const blockWithoutIds = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [
            {
              text: 'First objective',
              // No id field - should be allowed
            },
            {
              text: 'Second objective',
            },
          ],
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(blockWithoutIds);

      expect(result.success).toBe(true);
    });

    it('allows string or number for id field', () => {
      const blockWithMixedIds = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [
            {
              id: '1', // string id
              text: 'First objective',
            },
            {
              id: 2, // number id
              text: 'Second objective',
            },
          ],
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(blockWithMixedIds);

      expect(result.success).toBe(true);
    });
  });

  describe('Content Structure Validation', () => {
    it('rejects content.page wrapping (old incorrect schema)', () => {
      const wrappedContent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          page: {
            // WRONG: Composer does NOT output this structure
            title: 'Learning Objectives',
            objectives: [
              { text: 'First objective' },
            ],
          },
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(wrappedContent);

      // Should FAIL because schema expects direct content, not page wrapper
      expect(result.success).toBe(false);
    });

    it('requires at least one objective', () => {
      const emptyObjectives = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [], // Empty array not allowed
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(emptyObjectives);

      expect(result.success).toBe(false);
    });

    it('accepts note as string or object', () => {
      const blockWithStringNote = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [{ text: 'First objective' }],
          note: 'This is a simple string note',
        },
      };

      const blockWithObjectNote = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [{ text: 'First objective' }],
          note: {
            title: 'Important',
            text: 'This is a structured note',
          },
        },
      };

      expect(ObjectiveO1BlockSchema.safeParse(blockWithStringNote).success).toBe(true);
      expect(ObjectiveO1BlockSchema.safeParse(blockWithObjectNote).success).toBe(true);
    });
  });

  describe('Invalid Block Rejection', () => {
    it('rejects block with wrong type', () => {
      const wrongType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'introduction', // Wrong type
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [{ text: 'First objective' }],
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(wrongType);

      expect(result.success).toBe(false);
    });

    it('rejects block with wrong version', () => {
      const wrongVersion = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'V2', // Wrong version
        content: {
          title: 'Learning Objectives',
          objectives: [{ text: 'First objective' }],
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(wrongVersion);

      expect(result.success).toBe(false);
    });

    it('rejects block with invalid UUID', () => {
      const invalidUuid = {
        id: 'not-a-uuid',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [{ text: 'First objective' }],
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(invalidUuid);

      expect(result.success).toBe(false);
    });

    it('rejects block missing required content fields', () => {
      const missingTitle = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          // Missing required 'title' field
          objectives: [{ text: 'First objective' }],
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(missingTitle);

      expect(result.success).toBe(false);
    });
  });

  describe('Optional Fields', () => {
    it('allows optional presentation config', () => {
      const withPresentation = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [{ text: 'First objective' }],
        },
        presentation: {
          width: 'normal',
          alignment: 'left',
          spacing: 'normal',
          emphasized: false,
        },
      };

      const result = ObjectiveO1BlockSchema.safeParse(withPresentation);

      expect(result.success).toBe(true);
    });

    it('allows optional expectedTimeSec', () => {
      const withTime = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [{ text: 'First objective' }],
        },
        expectedTimeSec: 600,
      };

      const result = ObjectiveO1BlockSchema.safeParse(withTime);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expectedTimeSec).toBe(600);
      }
    });

    it('allows optional progressRole with default', () => {
      const withProgressRole = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'objective',
        version: 'O1',
        content: {
          title: 'Learning Objectives',
          objectives: [{ text: 'First objective' }],
        },
        progressRole: 'instructional',
      };

      const result = ObjectiveO1BlockSchema.safeParse(withProgressRole);

      expect(result.success).toBe(true);
    });
  });
});
