/**
 * Code C1 Tests
 * 
 * Phase 11.19 Architecture:
 * - Historical schema accepts legacy TutorialCodePayload
 * - Canonical schema stores transformed representation
 * - Converter performs lossless transformation
 * - Tests reflect PERMISSIVE canonical contract (current authoritative decision)
 */

import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
  CODE_VERSION_REGISTRY,
  ACTIVE_CODE_VERSIONS,
  type CodeVersion,
} from '../registries/code-versions';
import {
  CodeC1PageSchema,
  CodeC1AuthorContentSchema,
  CodeC1BlockSchema,
  HistoricalTutorialCodePayloadSchema,
  validateCodeC1AIOutput,
} from '../schemas/code-c1.schema';

// ============================================================
// REGISTRY TESTS
// ============================================================

describe('Code Version Registry', () => {
  it('contains all C1-C10 versions', () => {
    const expectedVersions: CodeVersion[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'];
    expectedVersions.forEach((version) => {
      expect(CODE_VERSION_REGISTRY[version]).toBeDefined();
    });
  });

  it('has C1 as active', () => {
    expect(CODE_VERSION_REGISTRY.C1.status).toBe('active');
    expect(ACTIVE_CODE_VERSIONS).toContain('C1');
  });

  it('has C2-C10 as planned', () => {
    const plannedVersions: CodeVersion[] = ['C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'];
    plannedVersions.forEach((version) => {
      expect(CODE_VERSION_REGISTRY[version].status).toBe('planned');
    });
  });

  it('C1 has correct metadata', () => {
    expect(CODE_VERSION_REGISTRY.C1.id).toBe('C1');
    expect(CODE_VERSION_REGISTRY.C1.label).toBe('Basic Syntax');
    expect(CODE_VERSION_REGISTRY.C1.description).toBeTruthy();
  });
});

// ============================================================
// CANONICAL SCHEMA TESTS (PERMISSIVE)
// Phase 11.19: Canonical schema accepts converter output
// ============================================================

describe('CodeC1PageSchema - Canonical Permissive Contract', () => {
  const minimalValidPage = {
    type: 'code' as const,
    title: 'OK',
    introduction: 'OK',
    language: 'javascript',
    code: 'x',
    explanation: [
      { focus: 'ok', description: 'ok' },
    ],
    takeaway: 'ok',
  };

  it('accepts minimal canonical page', () => {
    expect(() => CodeC1PageSchema.parse(minimalValidPage)).not.toThrow();
  });

  it('accepts short title (permissive)', () => {
    const page = { ...minimalValidPage, title: 'OK' };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts long title (permissive)', () => {
    const page = { ...minimalValidPage, title: 'x'.repeat(500) };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts short introduction (permissive)', () => {
    const page = { ...minimalValidPage, introduction: 'OK' };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts long introduction (permissive)', () => {
    const page = { ...minimalValidPage, introduction: 'x'.repeat(1000) };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts short code (permissive)', () => {
    const page = { ...minimalValidPage, code: 'x' };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts long code (permissive)', () => {
    const page = { ...minimalValidPage, code: 'x'.repeat(5000) };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts arbitrary language string (permissive)', () => {
    const page = { ...minimalValidPage, language: 'fortran' };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts 1 explanation item (permissive)', () => {
    const page = {
      ...minimalValidPage,
      explanation: [{ focus: 'ok', description: 'ok' }],
    };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts 10 explanation items (permissive)', () => {
    const page = {
      ...minimalValidPage,
      explanation: Array.from({ length: 10 }, (_, i) => ({
        focus: `item ${i}`,
        description: `desc ${i}`,
      })),
    };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts short takeaway (permissive)', () => {
    const page = { ...minimalValidPage, takeaway: 'ok' };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts long takeaway >382 chars (lossless conversion requirement)', () => {
    const page = { ...minimalValidPage, takeaway: 'x'.repeat(400) };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts all optional fields', () => {
    const fullPage = {
      ...minimalValidPage,
      filename: 'test.js',
      output: {
        value: 'result',
        description: 'output description',
      },
      practiceHint: 'try this',
      memoryModel: {
        type: 'table',
        description: 'memory layout',
      },
    };
    expect(() => CodeC1PageSchema.parse(fullPage)).not.toThrow();
  });

  it('accepts output without description', () => {
    const page = {
      ...minimalValidPage,
      output: { value: 'result' },
    };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts empty filename (permissive)', () => {
    const page = { ...minimalValidPage, filename: '' };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts short practiceHint (permissive)', () => {
    const page = { ...minimalValidPage, practiceHint: 'ok' };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });
});

// ============================================================
// CANONICAL STRUCTURAL TESTS
// Phase 11.19: Structural strictness preserved
// ============================================================

describe('CodeC1PageSchema - Structural Validation', () => {
  const validPage = {
    type: 'code' as const,
    title: 'Test',
    introduction: 'Introduction',
    language: 'javascript',
    code: 'code',
    explanation: [{ focus: 'focus', description: 'description' }],
    takeaway: 'takeaway',
  };

  it('rejects missing required type', () => {
    const { type, ...invalid } = validPage;
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects wrong type literal', () => {
    const invalid = { ...validPage, type: 'definition' };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects missing title', () => {
    const { title, ...invalid } = validPage;
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects missing introduction', () => {
    const { introduction, ...invalid } = validPage;
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects missing language', () => {
    const { language, ...invalid } = validPage;
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects missing code', () => {
    const { code, ...invalid } = validPage;
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects missing explanation', () => {
    const { explanation, ...invalid } = validPage;
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects missing takeaway', () => {
    const { takeaway, ...invalid } = validPage;
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects unknown fields (strict validation)', () => {
    const invalid = { ...validPage, unknownField: 'should fail' };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects malformed explanation structure', () => {
    const invalid = { ...validPage, explanation: [{ focus: 'ok' }] }; // missing description
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects malformed output structure', () => {
    const invalid = { ...validPage, output: { description: 'missing value' } };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });
});

// ============================================================
// HISTORICAL SCHEMA TESTS
// Phase 11.19: Historical schema accepts legacy TutorialCodePayload
// ============================================================

describe('HistoricalTutorialCodePayloadSchema', () => {
  const validHistorical = {
    page: {
      type: 'CODE + EXPLANATION',
      title: 'Python Addition Example',
      introduction: 'Learn how to add two numbers in Python.',
    },
    code: {
      language: 'Python',
      source: 'x = int(input())\ny = int(input())\nresult = x + y\nprint(result)',
    },
    explanation: {
      steps: [
        { number: 1, code: 'x = int(input())', description: 'Read first number' },
        { number: 2, code: 'y = int(input())', description: 'Read second number' },
      ],
    },
    takeaway: {
      items: [
        'The input() function receives data from the user.',
        'The int() function converts numeric text into an integer.',
      ],
    },
    tip: {
      text: 'Try different numbers',
    },
  };

  it('accepts valid historical TutorialCodePayload', () => {
    expect(() => HistoricalTutorialCodePayloadSchema.parse(validHistorical)).not.toThrow();
  });

  it('accepts takeaway as items array (historical format)', () => {
    const payload = {
      ...validHistorical,
      takeaway: {
        items: [
          'The <code>input()</code> function receives data from the user.',
          'The <code>int()</code> function converts numeric text into an integer.',
          'The <code>+</code> operator performs the addition.',
          'The expression <code>x + y</code> produces the calculated value.',
          'The variable <code>result</code> references the calculated result.',
          'The <code>print()</code> function displays the final result.',
        ],
      },
    };
    expect(() => HistoricalTutorialCodePayloadSchema.parse(payload)).not.toThrow();
  });

  it('accepts any language case (Python, python, PYTHON)', () => {
    ['Python', 'python', 'PYTHON', 'jAvAsCrIpT'].forEach((language) => {
      const payload = {
        ...validHistorical,
        code: { ...validHistorical.code, language },
      };
      expect(() => HistoricalTutorialCodePayloadSchema.parse(payload)).not.toThrow();
    });
  });

  it('accepts optional explanation', () => {
    const { explanation, ...payload } = validHistorical;
    expect(() => HistoricalTutorialCodePayloadSchema.parse(payload)).not.toThrow();
  });

  it('accepts optional output', () => {
    const payload = {
      ...validHistorical,
      output: {
        inputExample: { x: '5', y: '3' },
        value: '8',
      },
    };
    expect(() => HistoricalTutorialCodePayloadSchema.parse(payload)).not.toThrow();
  });

  it('accepts optional takeaway', () => {
    const { takeaway, ...payload } = validHistorical;
    expect(() => HistoricalTutorialCodePayloadSchema.parse(payload)).not.toThrow();
  });

  it('accepts optional tip', () => {
    const { tip, ...payload } = validHistorical;
    expect(() => HistoricalTutorialCodePayloadSchema.parse(payload)).not.toThrow();
  });

  it('accepts optional memoryModel', () => {
    const payload = {
      ...validHistorical,
      memoryModel: {
        type: 'table',
        description: 'Memory layout',
        columns: [
          { id: 'var', title: 'Variable' },
          { id: 'val', title: 'Value' },
        ],
      },
    };
    expect(() => HistoricalTutorialCodePayloadSchema.parse(payload)).not.toThrow();
  });

  it('allows additional fields (passthrough)', () => {
    const payload = {
      ...validHistorical,
      additionalField: 'should be allowed',
    };
    expect(() => HistoricalTutorialCodePayloadSchema.parse(payload)).not.toThrow();
  });
});

// ============================================================
// AUTHOR CONTENT TESTS
// ============================================================

describe('CodeC1AuthorContentSchema', () => {
  const validPage = {
    type: 'code' as const,
    title: 'Test',
    introduction: 'Introduction',
    language: 'javascript',
    code: 'code',
    explanation: [{ focus: 'focus', description: 'description' }],
    takeaway: 'takeaway',
  };

  it('accepts valid author content', () => {
    const content = { page: validPage };
    expect(() => CodeC1AuthorContentSchema.parse(content)).not.toThrow();
  });

  it('rejects missing page', () => {
    const invalid = {};
    expect(() => CodeC1AuthorContentSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects unknown root properties (strict)', () => {
    const invalid = { page: validPage, extra: 'field' };
    expect(() => CodeC1AuthorContentSchema.parse(invalid)).toThrow(ZodError);
  });

  it('accepts all permissive canonical variations', () => {
    const content = {
      page: {
        type: 'code' as const,
        title: 'x',
        introduction: 'x',
        language: 'ruby',
        code: 'x',
        explanation: [{ focus: 'x', description: 'x' }],
        takeaway: 'x'.repeat(500),
      },
    };
    expect(() => CodeC1AuthorContentSchema.parse(content)).not.toThrow();
  });
});

// ============================================================
// CANONICAL BLOCK TESTS
// ============================================================

describe('CodeC1BlockSchema', () => {
  const validPage = {
    type: 'code' as const,
    title: 'Test',
    introduction: 'Introduction',
    language: 'javascript',
    code: 'code',
    explanation: [{ focus: 'focus', description: 'description' }],
    takeaway: 'takeaway',
  };

  const validBlock = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'code' as const,
    version: 'C1' as const,
    content: { page: validPage },
  };

  it('accepts valid canonical block', () => {
    expect(() => CodeC1BlockSchema.parse(validBlock)).not.toThrow();
  });

  it('rejects invalid UUID', () => {
    const invalid = { ...validBlock, id: 'not-a-uuid' };
    expect(() => CodeC1BlockSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects wrong type', () => {
    const invalid = { ...validBlock, type: 'definition' };
    expect(() => CodeC1BlockSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects wrong version', () => {
    const invalid = { ...validBlock, version: 'C2' };
    expect(() => CodeC1BlockSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects missing content', () => {
    const { content, ...invalid } = validBlock;
    expect(() => CodeC1BlockSchema.parse(invalid)).toThrow(ZodError);
  });

  it('accepts permissive canonical content', () => {
    const block = {
      ...validBlock,
      content: {
        page: {
          type: 'code' as const,
          title: 'x',
          introduction: 'x',
          language: 'unknown',
          code: 'x',
          explanation: [{ focus: 'x', description: 'x' }],
          takeaway: 'x'.repeat(400),
        },
      },
    };
    expect(() => CodeC1BlockSchema.parse(block)).not.toThrow();
  });
});

// ============================================================
// VALIDATOR FUNCTION TESTS
// ============================================================

describe('validateCodeC1AIOutput', () => {
  const validPage = {
    type: 'code' as const,
    title: 'Test',
    introduction: 'Introduction',
    language: 'javascript',
    code: 'code',
    explanation: [{ focus: 'focus', description: 'description' }],
    takeaway: 'takeaway',
  };

  it('returns parsed result for valid input', () => {
    const input = { page: validPage };
    const result = validateCodeC1AIOutput(input);
    expect(result).toEqual(input);
    expect(result.page.type).toBe('code');
  });

  it('throws ZodError for invalid input', () => {
    const invalid = { page: { type: 'code' } }; // missing required fields
    expect(() => validateCodeC1AIOutput(invalid)).toThrow(ZodError);
  });

  it('exposes meaningful error paths for nested validation', () => {
    const invalid = {
      page: {
        ...validPage,
        explanation: [{ focus: 'ok' }], // missing description
      },
    };
    try {
      validateCodeC1AIOutput(invalid);
      expect.fail('Should have thrown ZodError');
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      const zodError = error as ZodError;
      expect(zodError.errors.length).toBeGreaterThan(0);
      expect(zodError.errors.some((e) => e.path.includes('explanation'))).toBe(true);
    }
  });

  it('rejects system metadata injection (strict validation)', () => {
    const invalid = {
      page: validPage,
      systemMetadata: { injected: true },
    };
    expect(() => validateCodeC1AIOutput(invalid)).toThrow(ZodError);
  });

  it('accepts permissive canonical content', () => {
    const input = {
      page: {
        type: 'code' as const,
        title: 'x',
        introduction: 'x',
        language: 'scala',
        code: 'x',
        explanation: [{ focus: 'x', description: 'x' }],
        takeaway: 'x'.repeat(500),
      },
    };
    const result = validateCodeC1AIOutput(input);
    expect(result.page.takeaway.length).toBe(500);
  });
});
