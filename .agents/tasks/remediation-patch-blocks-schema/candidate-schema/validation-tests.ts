/**
 * Objective O1 Block Schema - Validation Tests
 * 
 * Test suite verifying the runtime Zod schema accepts valid payloads
 * and rejects invalid ones according to the approved contract.
 * 
 * Run with: npx tsx validation-tests.ts
 */

import { ObjectiveO1BlockSchema } from './objective-o1.schema';

// ============================================================
// Test Utilities
// ============================================================

interface TestResult {
  name: string;
  passed: boolean;
  expected: 'valid' | 'invalid';
  actual: 'valid' | 'invalid';
  error?: string;
}

const results: TestResult[] = [];

function testValid(name: string, payload: unknown): void {
  const result = ObjectiveO1BlockSchema.safeParse(payload);
  results.push({
    name,
    passed: result.success,
    expected: 'valid',
    actual: result.success ? 'valid' : 'invalid',
    error: result.success ? undefined : JSON.stringify(result.error.format(), null, 2),
  });
}

function testInvalid(name: string, payload: unknown): void {
  const result = ObjectiveO1BlockSchema.safeParse(payload);
  results.push({
    name,
    passed: !result.success,
    expected: 'invalid',
    actual: result.success ? 'valid' : 'invalid',
    error: result.success ? 'Schema incorrectly accepted invalid payload' : undefined,
  });
}

function printResults(): void {
  console.log('\n' + '='.repeat(70));
  console.log('OBJECTIVE O1 BLOCK SCHEMA - VALIDATION TEST RESULTS');
  console.log('='.repeat(70) + '\n');

  let passCount = 0;
  let failCount = 0;

  results.forEach((result, index) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const statusColor = result.passed ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';

    console.log(`${statusColor}${status}${resetColor} Test ${index + 1}: ${result.name}`);
    console.log(`     Expected: ${result.expected}, Actual: ${result.actual}`);
    
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error.substring(0, 200)}...`);
    }
    console.log('');

    if (result.passed) passCount++;
    else failCount++;
  });

  console.log('='.repeat(70));
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('='.repeat(70) + '\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

// ============================================================
// Test Data: Valid Payloads
// ============================================================

const validMinimal = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Learning Objectives",
      objectives: [
        {
          id: "obj-1",
          text: "Understand basic concepts"
        }
      ]
    }
  }
};

const validFull = {
  id: "12345678-1234-1234-1234-123456789012",
  type: "objective",
  version: "O1",
  content: {
    page: {
      eyebrow: "LEARNING OBJECTIVES",
      title: "Skills You Will Develop in This Lesson",
      titleHighlight: "Will Develop",
      introduction: "By the end of this lesson, you will have the following practical skills:",
      objectives: [
        {
          id: "obj-1",
          verb: "Create",
          title: "Create and initialize lists",
          text: "Create Python lists using different methods and initialize them with values.",
          description: "Additional explanation of the skill",
          badge: "Practical Skill",
          icon: "create"
        },
        {
          id: "obj-2",
          verb: "Access",
          title: "Access list elements",
          text: "Retrieve values from lists using indexing and slicing.",
          badge: "Core Skill",
          icon: "access"
        }
      ],
      note: {
        title: "Note",
        text: "These are observable, practical skills you will develop in this lesson."
      }
    }
  },
  presentation: {
    width: "normal",
    spacing: "relaxed"
  },
  expectedTimeSec: 180,
  progressRole: "instructional"
};

const validStringNote = {
  id: "abcdef12-3456-7890-abcd-ef1234567890",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Core Concepts",
      objectives: [
        {
          id: "obj-1",
          text: "Master the fundamentals"
        }
      ],
      note: "This is a simple string note instead of an object."
    }
  }
};

const validMultipleObjectives = {
  id: "fedcba98-7654-3210-fedc-ba9876543210",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Advanced Topics",
      objectives: [
        { id: "1", text: "Objective 1" },
        { id: "2", text: "Objective 2" },
        { id: "3", text: "Objective 3" },
        { id: "4", text: "Objective 4" },
        { id: "5", text: "Objective 5" },
      ]
    }
  }
};

// Default payload from block.integration.json (wrapped in page)
const validDefaultPayload = {
  id: "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
  type: "objective",
  version: "O1",
  content: {
    page: {
      eyebrow: "LEARNING OBJECTIVES",
      title: "Skills You Will Develop in This Lesson",
      titleHighlight: "Will Develop",
      introduction: "By the end of this lesson, you will have the following practical skills:",
      objectives: [
        {
          id: "obj-1",
          verb: "Create",
          title: "Create and initialize lists",
          text: "Create Python lists using different methods and initialize them with values.",
          badge: "Practical Skill",
          icon: "create"
        }
      ],
      note: {
        title: "Note",
        text: "These are observable, practical skills you will develop in this lesson."
      }
    }
  }
};

const validWithAdditionalItemProperties = {
  id: "11111111-2222-3333-4444-555555555555",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Extended Objectives",
      objectives: [
        {
          id: "obj-1",
          text: "Primary objective text",
          customField: "Custom value allowed by passthrough",
          metadata: { nested: "data" }
        }
      ]
    }
  }
};

// ============================================================
// Test Data: Invalid Payloads
// ============================================================

const invalidWrongType = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "introduction", // Wrong type
  version: "O1",
  content: {
    page: {
      title: "Test",
      objectives: [{ id: "1", text: "Test" }]
    }
  }
};

const invalidWrongVersion = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O2", // Wrong version
  content: {
    page: {
      title: "Test",
      objectives: [{ id: "1", text: "Test" }]
    }
  }
};

const invalidMissingTitle = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      // Missing required title
      objectives: [{ id: "1", text: "Test" }]
    }
  }
};

const invalidEmptyObjectives = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Test",
      objectives: [] // Empty array not allowed
    }
  }
};

const invalidNoObjectives = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Test"
      // Missing required objectives array
    }
  }
};

const invalidBadUUID = {
  id: "not-a-valid-uuid", // Invalid UUID format
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Test",
      objectives: [{ id: "1", text: "Test" }]
    }
  }
};

const invalidObjectiveItemMissingId = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Test",
      objectives: [
        {
          // Missing required id
          text: "Test objective"
        }
      ]
    }
  }
};

const invalidObjectiveItemMissingText = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Test",
      objectives: [
        {
          id: "obj-1"
          // Missing required text
        }
      ]
    }
  }
};

const invalidMissingPageWrapper = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    // Missing page wrapper - flat content structure
    title: "Test",
    objectives: [{ id: "1", text: "Test" }]
  }
};

const invalidTitleTooLong = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "A".repeat(201), // Exceeds 200 char max
      objectives: [{ id: "1", text: "Test" }]
    }
  }
};

const invalidEmptyTitle = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "", // Empty string not allowed
      objectives: [{ id: "1", text: "Test" }]
    }
  }
};

const invalidNegativeExpectedTime = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Test",
      objectives: [{ id: "1", text: "Test" }]
    }
  },
  expectedTimeSec: -100 // Negative not allowed
};

const invalidTooManyObjectives = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "objective",
  version: "O1",
  content: {
    page: {
      title: "Test",
      objectives: Array.from({ length: 21 }, (_, i) => ({
        id: `obj-${i}`,
        text: `Objective ${i}`
      })) // Exceeds max of 20
    }
  }
};

// ============================================================
// Run Tests
// ============================================================

console.log('\nRunning Objective O1 Block Schema Validation Tests...\n');

// Valid payload tests
testValid('Valid: Minimal payload', validMinimal);
testValid('Valid: Full payload with all optional fields', validFull);
testValid('Valid: String note format', validStringNote);
testValid('Valid: Multiple objectives', validMultipleObjectives);
testValid('Valid: Default payload from block.integration.json', validDefaultPayload);
testValid('Valid: Additional properties on objective items (passthrough)', validWithAdditionalItemProperties);

// Invalid payload tests
testInvalid('Invalid: Wrong type field', invalidWrongType);
testInvalid('Invalid: Wrong version field', invalidWrongVersion);
testInvalid('Invalid: Missing required title', invalidMissingTitle);
testInvalid('Invalid: Empty objectives array', invalidEmptyObjectives);
testInvalid('Invalid: No objectives field', invalidNoObjectives);
testInvalid('Invalid: Bad UUID format', invalidBadUUID);
testInvalid('Invalid: Objective item missing id', invalidObjectiveItemMissingId);
testInvalid('Invalid: Objective item missing text', invalidObjectiveItemMissingText);
testInvalid('Invalid: Missing page wrapper (flat content)', invalidMissingPageWrapper);
testInvalid('Invalid: Title exceeds 200 characters', invalidTitleTooLong);
testInvalid('Invalid: Empty title string', invalidEmptyTitle);
testInvalid('Invalid: Negative expectedTimeSec', invalidNegativeExpectedTime);
testInvalid('Invalid: Too many objectives (>20)', invalidTooManyObjectives);

// Print results summary
printResults();
