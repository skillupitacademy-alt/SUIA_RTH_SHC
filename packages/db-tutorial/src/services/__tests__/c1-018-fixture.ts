/**
 * C1-018 Test Fixture
 * 
 * Test data for Composer → Storage → Delivery integration test
 * Tests Block architecture: Definition D1 + Code C1 + Code C1
 */

import { randomUUID } from 'crypto';
import type { TutorialBlock, TutorialDocument } from '@quiz/types';

export const C1_018_MARKER = 'C1-018-E2E-TEST';

export interface C1018Fixture {
  marker: string;
  definitionId: string;
  codeId1: string;
  codeId2: string;
  definitionBlock: TutorialBlock;
  codeBlock1: TutorialBlock;
  codeBlock2: TutorialBlock;
  initialDocument: TutorialDocument;
}

/**
 * Creates C1-018 test fixture with stable UUIDs for verification
 */
export function createC1018Fixture(): C1018Fixture {
  const definitionId = randomUUID();
  const codeId1 = randomUUID();
  const codeId2 = randomUUID();

  const definitionBlock: TutorialBlock = {
    id: definitionId,
    type: 'definition',
    version: 'D1',
    content: {
      page: {
        type: 'definition',
        category: 'Python Fundamentals',
        title: 'What Is a Python Variable?',
        intro:
          'A variable gives a name to a value so that a Python program can work with that value later.',
        definition:
          'A Python variable is a name that refers to an object stored in memory.',
        explanation: [
          'Python variables do not directly contain the value itself.',
          'The variable name refers to a Python object.',
          'The same object can be referenced by multiple names.',
        ],
        example: {
          language: 'python',
          code: 'name = "Alice"',
        },
        characteristics: [
          {
            icon: '🏷️',
            title: 'Name',
            description:
              'A variable provides a readable name for referring to an object.',
          },
          {
            icon: '🧠',
            title: 'Object Reference',
            description:
              'The variable refers to an object rather than storing a primitive value directly.',
          },
        ],
        takeaway:
          'Think of a Python variable as a name that refers to an object.',
      },
    },
  };

  const codeBlock1: TutorialBlock = {
    id: codeId1,
    type: 'code',
    version: 'C1',
    content: {
      page: {
        type: 'code',
        title: 'Creating a Python Variable',
        introduction:
          'Python variables can be created by assigning a value to a name using the assignment operator.',
        language: 'python',
        code: 'name = "Alice"\nage = 25\nprint(name)\nprint(age)',
        explanation: [
          {
            focus: 'name = "Alice"',
            description:
              'The name variable refers to the string object "Alice".',
          },
          {
            focus: 'age = 25',
            description: 'The age variable refers to the integer object 25.',
          },
          {
            focus: 'print(name)',
            description:
              'Python retrieves the object referenced by name and prints it.',
          },
        ],
        output: {
          value: 'Alice\n25',
          description: 'The program prints both variable values',
        },
        takeaway:
          'Assignment creates or updates a name-to-object reference in Python.',
      },
    },
  };

  const codeBlock2: TutorialBlock = {
    id: codeId2,
    type: 'code',
    version: 'C1',
    content: {
      page: {
        type: 'code',
        title: 'Changing a Python Variable',
        introduction:
          'A variable can later be assigned to a different object through reassignment.',
        language: 'python',
        code: 'score = 10\nprint(score)\nscore = 20\nprint(score)',
        explanation: [
          {
            focus: 'score = 10',
            description:
              'score initially refers to the integer object 10.',
          },
          {
            focus: 'score = 20',
            description:
              'The name score is reassigned to the integer object 20.',
          },
        ],
        output: {
          value: '10\n20',
        },
        takeaway:
          'Variables can be reassigned to different objects during execution.',
      },
    },
  };

  const initialDocument: TutorialDocument = {
    schemaVersion: 1,
    blocks: [definitionBlock],
  };

  return {
    marker: C1_018_MARKER,
    definitionId,
    codeId1,
    codeId2,
    definitionBlock,
    codeBlock1,
    codeBlock2,
    initialDocument,
  };
}

/**
 * Creates updated definition block for UPDATE test
 */
export function createUpdatedDefinitionBlock(originalId: string): TutorialBlock {
  return {
    id: originalId, // MUST preserve original ID
    type: 'definition',
    version: 'D1',
    content: {
      page: {
        type: 'definition',
        category: 'Python Fundamentals',
        title: 'What Is a Python Variable? — Updated',
        intro:
          'Python variables provide readable names that refer to objects.',
        definition:
          'A Python variable is a name bound to an object, and that binding can change during program execution.',
        explanation: [
          'Python variables do not directly contain the value itself.',
          'The variable name refers to a Python object.',
          'The same object can be referenced by multiple names.',
        ],
        example: {
          language: 'python',
          code: 'name = "Alice"',
        },
        characteristics: [
          {
            icon: '🏷️',
            title: 'Name',
            description:
              'A variable provides a readable name for referring to an object.',
          },
          {
            icon: '🧠',
            title: 'Object Reference',
            description:
              'The variable refers to an object rather than storing a primitive value directly.',
          },
        ],
        takeaway:
          'Think of a Python variable as a name that refers to an object.',
      },
    },
  };
}
