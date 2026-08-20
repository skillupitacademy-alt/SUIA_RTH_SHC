/**
 * Code C1 Tests
 * Validates registry, schemas, and validator function
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
  validateCodeC1AIOutput,
} from '../schemas/code-c1.schema';
import { SUPPORTED_CODE_LANGUAGES } from '../constants';

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
// VALID C1 PAGE TESTS
// ============================================================

describe('CodeC1PageSchema - Valid Inputs', () => {
  const minimalValidPage = {
    type: 'code' as const,
    title: 'Hello World',
    introduction: 'This is a basic introduction to demonstrate minimum requirements.',
    language: 'javascript',
    code: 'console.log("Hello");',
    explanation: [
      { focus: 'console.log', description: 'Prints the message to console output.' },
      { focus: 'string', description: 'The text is enclosed in quotes.' },
    ],
    takeaway: 'You learned how to print.',
  };

  it('accepts minimum valid page', () => {
    expect(() => CodeC1PageSchema.parse(minimalValidPage)).not.toThrow();
  });

  it('accepts all optional fields', () => {
    const fullPage = {
      ...minimalValidPage,
      filename: 'hello.js',
      output: {
        value: 'Hello',
        description: 'Output printed',
      },
      practiceHint: 'Try changing the message.',
    };
    expect(() => CodeC1PageSchema.parse(fullPage)).not.toThrow();
  });

  it('accepts 2 explanation items', () => {
    const page = { ...minimalValidPage };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts 6 explanation items', () => {
    const page = {
      ...minimalValidPage,
      explanation: [
        { focus: 'item 1', description: 'Description for item 1' },
        { focus: 'item 2', description: 'Description for item 2' },
        { focus: 'item 3', description: 'Description for item 3' },
        { focus: 'item 4', description: 'Description for item 4' },
        { focus: 'item 5', description: 'Description for item 5' },
        { focus: 'item 6', description: 'Description for item 6' },
      ],
    };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });

  it('accepts all supported languages', () => {
    SUPPORTED_CODE_LANGUAGES.forEach((language) => {
      const page = { ...minimalValidPage, language };
      expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
    });
  });

  it('accepts output without description', () => {
    const page = {
      ...minimalValidPage,
      output: { value: 'Result' },
    };
    expect(() => CodeC1PageSchema.parse(page)).not.toThrow();
  });
});

// ============================================================
// INVALID C1 PAGE TESTS
// ============================================================

describe('CodeC1PageSchema - Invalid Inputs', () => {
  const validPage = {
    type: 'code' as const,
    title: 'Hello World',
    introduction: 'This is a basic introduction to demonstrate minimum requirements.',
    language: 'javascript',
    code: 'console.log("Hello");',
    explanation: [
      { focus: 'console.log', description: 'Prints the message to console output.' },
      { focus: 'string', description: 'The text is enclosed in quotes.' },
    ],
    takeaway: 'You learned how to print.',
  };

  it('rejects missing required type', () => {
    const { type, ...invalid } = validPage;
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects wrong type value', () => {
    const invalid = { ...validPage, type: 'definition' };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects title below 10 chars', () => {
    const invalid = { ...validPage, title: 'Short' };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects title above 150 chars', () => {
    const invalid = { ...validPage, title: 'x'.repeat(151) };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects introduction below 50 chars', () => {
    const invalid = { ...validPage, introduction: 'Too short intro.' };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects introduction above 500 chars', () => {
    const invalid = { ...validPage, introduction: 'x'.repeat(501) };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects code below 10 chars', () => {
    const invalid = { ...validPage, code: 'short' };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects code above 2000 chars', () => {
    const invalid = { ...validPage, code: 'x'.repeat(2001) };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects unsupported language', () => {
    const invalid = { ...validPage, language: 'fortran' };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('validates filename boundaries (empty/1/100/101 chars)', () => {
    expect(() => CodeC1PageSchema.parse({ ...validPage, filename: '' })).toThrow(ZodError);
    expect(() => CodeC1PageSchema.parse({ ...validPage, filename: 'a' })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, filename: 'x'.repeat(100) })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, filename: 'x'.repeat(101) })).toThrow(ZodError);
  });

  it('rejects explanation with 1 item', () => {
    const invalid = {
      ...validPage,
      explanation: [{ focus: 'single', description: 'Only one item here.' }],
    };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects explanation with 7 items', () => {
    const invalid = {
      ...validPage,
      explanation: [
        { focus: 'item 1', description: 'Description 1' },
        { focus: 'item 2', description: 'Description 2' },
        { focus: 'item 3', description: 'Description 3' },
        { focus: 'item 4', description: 'Description 4' },
        { focus: 'item 5', description: 'Description 5' },
        { focus: 'item 6', description: 'Description 6' },
        { focus: 'item 7', description: 'Description 7' },
      ],
    };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('validates explanation focus boundaries (4/5/100/101 chars)', () => {
    const makeExplanation = (focus: string) => [
      { focus, description: 'Valid description here.' },
      { focus: 'console.log', description: 'Valid twenty char str' },
    ];
    expect(() => CodeC1PageSchema.parse({ ...validPage, explanation: makeExplanation('four') })).toThrow(ZodError);
    expect(() => CodeC1PageSchema.parse({ ...validPage, explanation: makeExplanation('five!') })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, explanation: makeExplanation('x'.repeat(100)) })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, explanation: makeExplanation('x'.repeat(101)) })).toThrow(ZodError);
  });

  it('rejects explanation focus above 100 chars', () => {
    const invalid = {
      ...validPage,
      explanation: [
        { focus: 'x'.repeat(101), description: 'Valid description.' },
        { focus: 'console.log', description: 'Another valid one.' },
      ],
    };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('validates explanation description boundaries (19/20/300/301 chars)', () => {
    const makeExplanation = (desc: string) => [
      { focus: 'console.log', description: desc },
      { focus: 'string', description: 'Valid twenty char str' },
    ];
    expect(() => CodeC1PageSchema.parse({ ...validPage, explanation: makeExplanation('Nineteen characters') })).toThrow(ZodError);
    expect(() => CodeC1PageSchema.parse({ ...validPage, explanation: makeExplanation('Exactly twenty chars') })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, explanation: makeExplanation('x'.repeat(300)) })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, explanation: makeExplanation('x'.repeat(301)) })).toThrow(ZodError);
  });

  it('rejects explanation description above 300 chars', () => {
    const invalid = {
      ...validPage,
      explanation: [
        { focus: 'console.log', description: 'x'.repeat(301) },
        { focus: 'string', description: 'Another valid description.' },
      ],
    };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('validates output value boundaries (empty/1/500/501 chars)', () => {
    expect(() => CodeC1PageSchema.parse({ ...validPage, output: { value: '' } })).toThrow(ZodError);
    expect(() => CodeC1PageSchema.parse({ ...validPage, output: { value: 'x' } })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, output: { value: 'x'.repeat(500) } })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, output: { value: 'x'.repeat(501) } })).toThrow(ZodError);
  });

  it('validates output description boundaries (0/200/201 chars)', () => {
    expect(() => CodeC1PageSchema.parse({ ...validPage, output: { value: 'Result', description: '' } })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, output: { value: 'Result', description: 'x'.repeat(200) } })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, output: { value: 'Result', description: 'x'.repeat(201) } })).toThrow(ZodError);
  });

  it('validates takeaway boundaries (19/20/200/201 chars)', () => {
    expect(() => CodeC1PageSchema.parse({ ...validPage, takeaway: 'Nineteen characters' })).toThrow(ZodError);
    expect(() => CodeC1PageSchema.parse({ ...validPage, takeaway: 'Exactly twenty chars' })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, takeaway: 'x'.repeat(200) })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, takeaway: 'x'.repeat(201) })).toThrow(ZodError);
  });

  it('rejects takeaway above 200 chars', () => {
    const invalid = { ...validPage, takeaway: 'x'.repeat(201) };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('validates practiceHint boundaries (19/20/200/201 chars)', () => {
    expect(() => CodeC1PageSchema.parse({ ...validPage, practiceHint: 'Nineteen characters' })).toThrow(ZodError);
    expect(() => CodeC1PageSchema.parse({ ...validPage, practiceHint: 'Exactly twenty chars' })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, practiceHint: 'x'.repeat(200) })).not.toThrow();
    expect(() => CodeC1PageSchema.parse({ ...validPage, practiceHint: 'x'.repeat(201) })).toThrow(ZodError);
  });

  it('rejects practiceHint above 200 chars', () => {
    const invalid = { ...validPage, practiceHint: 'x'.repeat(201) };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects unknown fields with strict validation', () => {
    const invalid = { ...validPage, unknownField: 'should fail' };
    expect(() => CodeC1PageSchema.parse(invalid)).toThrow(ZodError);
  });
});

// ============================================================
// AUTHOR CONTENT TESTS
// ============================================================

describe('CodeC1AuthorContentSchema', () => {
  const validPage = {
    type: 'code' as const,
    title: 'Hello World',
    introduction: 'This is a basic introduction to demonstrate minimum requirements.',
    language: 'javascript',
    code: 'console.log("Hello");',
    explanation: [
      { focus: 'console.log', description: 'Prints the message to console output.' },
      { focus: 'string', description: 'The text is enclosed in quotes.' },
    ],
    takeaway: 'You learned how to print.',
  };

  it('accepts valid author content', () => {
    const content = { page: validPage };
    expect(() => CodeC1AuthorContentSchema.parse(content)).not.toThrow();
  });

  it('rejects missing page', () => {
    const invalid = {};
    expect(() => CodeC1AuthorContentSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects unknown root properties', () => {
    const invalid = { page: validPage, extra: 'field' };
    expect(() => CodeC1AuthorContentSchema.parse(invalid)).toThrow(ZodError);
  });
});

// ============================================================
// CANONICAL BLOCK TESTS
// ============================================================

describe('CodeC1BlockSchema', () => {
  const validPage = {
    type: 'code' as const,
    title: 'Hello World',
    introduction: 'This is a basic introduction to demonstrate minimum requirements.',
    language: 'javascript',
    code: 'console.log("Hello");',
    explanation: [
      { focus: 'console.log', description: 'Prints the message to console output.' },
      { focus: 'string', description: 'The text is enclosed in quotes.' },
    ],
    takeaway: 'You learned how to print.',
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
});

// ============================================================
// VALIDATOR FUNCTION TESTS
// ============================================================

describe('validateCodeC1AIOutput', () => {
  const validPage = {
    type: 'code' as const,
    title: 'Hello World',
    introduction: 'This is a basic introduction to demonstrate minimum requirements.',
    language: 'javascript',
    code: 'console.log("Hello");',
    explanation: [
      { focus: 'console.log', description: 'Prints the message to console output.' },
      { focus: 'string', description: 'The text is enclosed in quotes.' },
    ],
    takeaway: 'You learned how to print.',
  };

  it('returns parsed result for valid input', () => {
    const input = { page: validPage };
    const result = validateCodeC1AIOutput(input);
    expect(result).toEqual(input);
    expect(result.page.type).toBe('code');
  });

  it('throws ZodError for invalid input', () => {
    const invalid = { page: { type: 'code', title: 'x' } };
    expect(() => validateCodeC1AIOutput(invalid)).toThrow(ZodError);
  });

  it('exposes meaningful error paths for nested validation', () => {
    const invalid = {
      page: {
        ...validPage,
        explanation: [{ focus: 'ok', description: 'short' }],
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

  it('rejects system metadata injection', () => {
    const invalid = {
      page: validPage,
      systemMetadata: { injected: true },
    };
    expect(() => validateCodeC1AIOutput(invalid)).toThrow(ZodError);
  });
});
