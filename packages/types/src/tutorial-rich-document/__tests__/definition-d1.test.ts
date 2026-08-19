/**
 * Definition D1 - Type and Schema Tests
 * Verifies D1 implementation matches locked contract
 */

import { describe, it, expect } from 'vitest';
import {
  DEFINITION_VERSION_REGISTRY,
  ACTIVE_DEFINITION_VERSIONS,
  DefinitionD1PageSchema,
  DefinitionD1AuthorContentSchema,
  DefinitionD1BlockSchema,
  validateDefinitionD1AIOutput,
} from '../index';
import type {
  DefinitionD1Page,
  DefinitionD1AuthorContent,
  DefinitionD1Block,
} from '../index';

describe('Definition D1 - Version Registry', () => {
  it('should have D1 as active version', () => {
    expect(DEFINITION_VERSION_REGISTRY.D1.status).toBe('active');
    expect(ACTIVE_DEFINITION_VERSIONS).toContain('D1');
  });

  it('should have D2-D6 as planned versions', () => {
    expect(DEFINITION_VERSION_REGISTRY.D2.status).toBe('planned');
    expect(DEFINITION_VERSION_REGISTRY.D3.status).toBe('planned');
    expect(DEFINITION_VERSION_REGISTRY.D4.status).toBe('planned');
    expect(DEFINITION_VERSION_REGISTRY.D5.status).toBe('planned');
    expect(DEFINITION_VERSION_REGISTRY.D6.status).toBe('planned');
  });
});

describe('Definition D1 - Author Content', () => {
  const validPage: DefinitionD1Page = {
    type: 'definition',
    category: 'Python Fundamentals',
    title: 'What Is a Variable?',
    intro: 'A variable is a name given to a value or an object in memory.',
    definition: 'A variable is a symbolic name that refers to an object stored in memory.',
    explanation: [
      'When you create a variable, Python allocates memory for a value.',
      'Variables make your code easier to read and maintain.',
    ],
    example: {
      language: 'python',
      code: 'x = 10\nprint(x)',
    },
    characteristics: [
      {
        icon: '○',
        title: 'Named Reference',
        description: 'A variable is a name that refers to a value or object.',
      },
    ],
    takeaway: 'A variable is a name that points to an object in memory.',
  };

  const validAuthorContent: DefinitionD1AuthorContent = {
    page: validPage,
  };

  it('should validate correct D1 page structure', () => {
    expect(() => DefinitionD1PageSchema.parse(validPage)).not.toThrow();
  });

  it('should validate correct D1 author content', () => {
    expect(() => DefinitionD1AuthorContentSchema.parse(validAuthorContent)).not.toThrow();
  });

  it('should validate AI output using helper function', () => {
    expect(() => validateDefinitionD1AIOutput(validAuthorContent)).not.toThrow();
  });

  it('should reject author content with extra fields (strict mode)', () => {
    const invalidContent = {
      page: validPage,
      extraField: 'should fail',
    };
    expect(() => DefinitionD1AuthorContentSchema.parse(invalidContent)).toThrow();
  });

  it('should reject page with missing required fields', () => {
    const invalidPage = {
      type: 'definition',
      title: 'Missing required fields',
    };
    expect(() => DefinitionD1PageSchema.parse(invalidPage)).toThrow();
  });
});

describe('Definition D1 - Canonical Block', () => {
  const validBlock: DefinitionD1Block = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'definition',
    version: 'D1',
    content: {
      page: {
        type: 'definition',
        category: 'Python Fundamentals',
        title: 'What Is a Variable?',
        intro: 'A variable is a name given to a value.',
        definition: 'A variable is a symbolic name that refers to an object.',
        explanation: ['Variables make code easier to read.'],
        example: {
          language: 'python',
          code: 'x = 10',
        },
        characteristics: [
          {
            icon: '○',
            title: 'Named Reference',
            description: 'A variable is a name.',
          },
        ],
        takeaway: 'A variable points to an object.',
      },
    },
  };

  it('should validate correct D1 canonical block', () => {
    expect(() => DefinitionD1BlockSchema.parse(validBlock)).not.toThrow();
  });

  it('should enforce version field as D1', () => {
    const invalidBlock = { ...validBlock, version: 'D2' };
    expect(() => DefinitionD1BlockSchema.parse(invalidBlock)).toThrow();
  });

  it('should enforce type field as definition', () => {
    const invalidBlock = { ...validBlock, type: 'code' };
    expect(() => DefinitionD1BlockSchema.parse(invalidBlock)).toThrow();
  });

  it('should enforce valid UUID for id', () => {
    const invalidBlock = { ...validBlock, id: 'not-a-uuid' };
    expect(() => DefinitionD1BlockSchema.parse(invalidBlock)).toThrow();
  });
});

describe('Definition D1 - Contract Preservation', () => {
  it('should preserve category field (not hierarchy)', () => {
    const page: DefinitionD1Page = {
      type: 'definition',
      category: 'Java Fundamentals', // Learner-facing label
      title: 'What Is Java?',
      intro: 'Java is a programming language.',
      definition: 'Java is an object-oriented language.',
      explanation: ['Java runs on the JVM.'],
      example: {
        language: 'java',
        code: 'System.out.println("Hello");',
      },
      characteristics: [],
      takeaway: 'Java is platform independent.',
    };

    expect(() => DefinitionD1PageSchema.parse(page)).not.toThrow();
    expect(page.category).toBe('Java Fundamentals');
  });

  it('should enforce page wrapper in content', () => {
    const contentWithPage = {
      page: {
        type: 'definition',
        category: 'Test',
        title: 'Test',
        intro: 'Test intro',
        definition: 'Test definition',
        explanation: ['Test explanation'],
        example: { language: 'python', code: 'test' },
        characteristics: [],
        takeaway: 'Test takeaway',
      },
    };

    expect(() => DefinitionD1AuthorContentSchema.parse(contentWithPage)).not.toThrow();
  });
});
