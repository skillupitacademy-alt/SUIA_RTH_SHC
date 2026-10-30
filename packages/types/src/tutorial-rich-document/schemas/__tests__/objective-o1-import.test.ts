/**
 * Import Resolution Test for Objective O1 Schema
 * Verifies that ObjectiveO1BlockSchema can be imported and used
 */

import { ObjectiveO1BlockSchema, ObjectiveO1Block } from '../objective-o1.schema';
import { describe, it, expect } from 'vitest';

describe('Objective O1 Schema Import Resolution', () => {
  it('should import ObjectiveO1BlockSchema successfully', () => {
    expect(ObjectiveO1BlockSchema).toBeDefined();
    expect(typeof ObjectiveO1BlockSchema.parse).toBe('function');
    expect(typeof ObjectiveO1BlockSchema.safeParse).toBe('function');
  });

  it('should validate a valid O1 block', () => {
    const validBlock: ObjectiveO1Block = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'objective',
      version: 'O1',
      content: {
        page: {
          title: 'Learning Objectives',
          objectives: [
            {
              id: 'obj1',
              text: 'Understand core concepts',
            },
          ],
        },
      },
      presentation: undefined,
    };

    const result = ObjectiveO1BlockSchema.safeParse(validBlock);
    expect(result.success).toBe(true);
  });

  it('should reject an invalid O1 block (wrong type)', () => {
    const invalidBlock = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'introduction', // Wrong type
      version: 'O1',
      content: {
        page: {
          title: 'Learning Objectives',
          objectives: [
            {
              id: 'obj1',
              text: 'Understand core concepts',
            },
          ],
        },
      },
      presentation: undefined,
    };

    const result = ObjectiveO1BlockSchema.safeParse(invalidBlock);
    expect(result.success).toBe(false);
  });

  it('should reject an invalid O1 block (missing objectives)', () => {
    const invalidBlock = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'objective',
      version: 'O1',
      content: {
        page: {
          title: 'Learning Objectives',
          objectives: [], // Empty array violates .min(1)
        },
      },
      presentation: undefined,
    };

    const result = ObjectiveO1BlockSchema.safeParse(invalidBlock);
    expect(result.success).toBe(false);
  });
});
