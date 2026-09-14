/**
 * Introduction I1 Schema Tests
 * Validates schema validation behavior
 */

import { describe, it, expect } from 'vitest';
import {
  IntroductionIconKeySchema,
  IntroductionI1PageSchema,
  IntroductionI1AuthorContentSchema,
  IntroductionI1BlockSchema,
  validateIntroductionI1AIOutput,
} from '../introduction-i1.schema';

describe('IntroductionIconKeySchema', () => {
  it('should validate approved icon keys', () => {
    const validIcons = [
      'book-open',
      'target',
      'lightbulb',
      'route',
      'code',
      'layers',
      'check-circle',
      'arrow-right',
      'graduation-cap',
      'rocket',
      'wrench',
      'globe',
      'zap',
      'star',
      'box',
    ];

    validIcons.forEach((icon) => {
      const result = IntroductionIconKeySchema.safeParse(icon);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid icon keys', () => {
    const invalidIcons = ['invalid-icon', 'fa-book', 'custom-icon', ''];

    invalidIcons.forEach((icon) => {
      const result = IntroductionIconKeySchema.safeParse(icon);
      expect(result.success).toBe(false);
    });
  });
});

describe('IntroductionI1PageSchema', () => {
  const validPage = {
    badge: 'Introduction Block',
    title: 'Functions in JavaScript',
    subtitle: 'Learn about functions and how they work',
    motto: {
      lines: ['Know', 'Your Path.', 'Learn with', 'Purpose.'],
    },
    learningGoal: 'Understand what functions are and how to use them',
    topic: {
      title: 'The Topic',
      description: 'Functions are reusable blocks of code',
      quote: 'Functions are essential to modern JavaScript',
    },
    whereFit: {
      title: 'Where Does It Fit?',
      description: 'Functions are a core part of JavaScript',
      flowCards: [
        {
          title: 'JavaScript',
          subtitle: 'Programming language',
          icon: 'code' as const,
        },
        {
          title: 'Functions',
          subtitle: 'Reusable code blocks',
          icon: 'box' as const,
          highlight: true,
        },
      ],
    },
    solution: {
      title: 'The Solution',
      description: 'Create a function to solve the problem',
      code: {
        language: 'javascript',
        code: 'function hello() { return "world"; }',
      },
    },
    whereUsed: {
      title: 'Where Is It Used?',
      description: 'Functions are used everywhere',
      useCases: [
        {
          title: 'Web Applications',
          description: 'Build interactive websites',
          icon: 'globe' as const,
        },
      ],
    },
    roadmap: {
      title: 'What Will You Learn?',
      description: 'Step by step learning path',
      steps: [
        {
          title: 'Basics',
          subtitle: 'Learn function syntax',
        },
        {
          title: 'Advanced',
          subtitle: 'Master closures',
        },
      ],
    },
    whyMatters: {
      title: 'Why This Matters',
      benefits: [
        {
          title: 'Reusability',
          subtitle: 'Write once, use many times',
          icon: 'rocket' as const,
        },
      ],
    },
    keyTakeaway: 'Functions are fundamental building blocks',
  };

  it('should validate a complete valid page', () => {
    const result = IntroductionI1PageSchema.safeParse(validPage);
    expect(result.success).toBe(true);
  });

  it('should reject page missing required fields', () => {
    const invalidPage = {
      badge: 'Introduction',
      title: 'Functions',
      // missing subtitle, motto, etc.
    };

    const result = IntroductionI1PageSchema.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });

  it('should reject page with invalid motto (not 4 lines)', () => {
    const invalidPage = {
      ...validPage,
      motto: {
        lines: ['Only', 'Three', 'Lines'], // Should be 4
      },
    };

    const result = IntroductionI1PageSchema.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });

  it('should reject page with invalid icon', () => {
    const invalidPage = {
      ...validPage,
      whereFit: {
        ...validPage.whereFit,
        flowCards: [
          {
            title: 'Test',
            subtitle: 'Test subtitle',
            icon: 'invalid-icon', // Not in registry
          },
        ],
      },
    };

    const result = IntroductionI1PageSchema.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });

  it('should reject page with unknown fields (strict mode)', () => {
    const invalidPage = {
      ...validPage,
      unknownField: 'not allowed',
    };

    const result = IntroductionI1PageSchema.safeParse(invalidPage);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe('unrecognized_keys');
    }
  });

  it('should accept page with optional highlight fields', () => {
    const pageWithHighlight = {
      ...validPage,
      whereFit: {
        ...validPage.whereFit,
        flowCards: [
          ...validPage.whereFit.flowCards,
          {
            title: 'Test',
            subtitle: 'Test subtitle',
            icon: 'star' as const,
            highlight: false,
          },
        ],
      },
    };

    const result = IntroductionI1PageSchema.safeParse(pageWithHighlight);
    expect(result.success).toBe(true);
  });

  it('should validate nested object strictness', () => {
    const invalidPage = {
      ...validPage,
      topic: {
        ...validPage.topic,
        extraField: 'not allowed',
      },
    };

    const result = IntroductionI1PageSchema.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });
});

describe('IntroductionI1AuthorContentSchema', () => {
  const validContent = {
    page: {
      badge: 'Introduction Block',
      title: 'Functions in JavaScript',
      subtitle: 'Learn about functions',
      motto: {
        lines: ['Know', 'Your Path.', 'Learn with', 'Purpose.'],
      },
      learningGoal: 'Understand functions',
      topic: {
        title: 'The Topic',
        description: 'Functions explained',
        quote: 'Functions are essential',
      },
      whereFit: {
        title: 'Where Does It Fit?',
        description: 'In JavaScript',
        flowCards: [
          {
            title: 'Functions',
            subtitle: 'Core concept',
            icon: 'code' as const,
          },
        ],
      },
      solution: {
        title: 'The Solution',
        description: 'Use functions',
        code: {
          language: 'javascript',
          code: 'function test() {}',
        },
      },
      whereUsed: {
        title: 'Where Is It Used?',
        description: 'Everywhere',
        useCases: [
          {
            title: 'Web',
            description: 'Web apps',
            icon: 'globe' as const,
          },
        ],
      },
      roadmap: {
        title: 'What Will You Learn?',
        description: 'Learning path',
        steps: [
          {
            title: 'Step 1',
            subtitle: 'Basics',
          },
        ],
      },
      whyMatters: {
        title: 'Why This Matters',
        benefits: [
          {
            title: 'Benefit',
            subtitle: 'Description',
            icon: 'star' as const,
          },
        ],
      },
      keyTakeaway: 'Functions are important',
    },
  };

  it('should validate valid author content', () => {
    const result = IntroductionI1AuthorContentSchema.safeParse(validContent);
    expect(result.success).toBe(true);
  });

  it('should reject content without page wrapper', () => {
    const invalidContent = {
      badge: 'Introduction Block',
      title: 'Functions',
      // Not wrapped in page
    };

    const result = IntroductionI1AuthorContentSchema.safeParse(invalidContent);
    expect(result.success).toBe(false);
  });

  it('should reject content with unknown fields (strict mode)', () => {
    const invalidContent = {
      ...validContent,
      unknownField: 'not allowed',
    };

    const result = IntroductionI1AuthorContentSchema.safeParse(invalidContent);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe('unrecognized_keys');
    }
  });
});

describe('IntroductionI1BlockSchema', () => {
  const validBlock = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'introduction' as const,
    version: 'I1' as const,
    content: {
      page: {
        badge: 'Introduction Block',
        title: 'Functions in JavaScript',
        subtitle: 'Learn about functions',
        motto: {
          lines: ['Know', 'Your Path.', 'Learn with', 'Purpose.'],
        },
        learningGoal: 'Understand functions',
        topic: {
          title: 'The Topic',
          description: 'Functions explained',
          quote: 'Functions are essential',
        },
        whereFit: {
          title: 'Where Does It Fit?',
          description: 'In JavaScript',
          flowCards: [
            {
              title: 'Functions',
              subtitle: 'Core concept',
              icon: 'code' as const,
            },
          ],
        },
        solution: {
          title: 'The Solution',
          description: 'Use functions',
          code: {
            language: 'javascript',
            code: 'function test() {}',
          },
        },
        whereUsed: {
          title: 'Where Is It Used?',
          description: 'Everywhere',
          useCases: [
            {
              title: 'Web',
              description: 'Web apps',
              icon: 'globe' as const,
            },
          ],
        },
        roadmap: {
          title: 'What Will You Learn?',
          description: 'Learning path',
          steps: [
            {
              title: 'Step 1',
              subtitle: 'Basics',
            },
          ],
        },
        whyMatters: {
          title: 'Why This Matters',
          benefits: [
            {
              title: 'Benefit',
              subtitle: 'Description',
              icon: 'star' as const,
            },
          ],
        },
        keyTakeaway: 'Functions are important',
      },
    },
    presentation: {},
    expectedTimeSec: 180,
  };

  it('should validate a complete valid I1 block', () => {
    const result = IntroductionI1BlockSchema.safeParse(validBlock);
    expect(result.success).toBe(true);
  });

  it('should validate block without optional expectedTimeSec', () => {
    const blockWithoutExpectedTime = {
      ...validBlock,
      expectedTimeSec: undefined,
    };

    const result = IntroductionI1BlockSchema.safeParse(blockWithoutExpectedTime);
    expect(result.success).toBe(true);
  });

  it('should validate block without optional presentation', () => {
    const { presentation, ...blockWithoutPresentation } = validBlock;

    const result = IntroductionI1BlockSchema.safeParse(blockWithoutPresentation);
    expect(result.success).toBe(true);
  });

  it('should reject block with wrong version', () => {
    const invalidBlock = {
      ...validBlock,
      version: 'D1', // Wrong version
    };

    const result = IntroductionI1BlockSchema.safeParse(invalidBlock);
    expect(result.success).toBe(false);
  });

  it('should reject block with wrong type', () => {
    const invalidBlock = {
      ...validBlock,
      type: 'definition', // Wrong type
    };

    const result = IntroductionI1BlockSchema.safeParse(invalidBlock);
    expect(result.success).toBe(false);
  });

  it('should reject block with invalid UUID', () => {
    const invalidBlock = {
      ...validBlock,
      id: 'not-a-uuid',
    };

    const result = IntroductionI1BlockSchema.safeParse(invalidBlock);
    expect(result.success).toBe(false);
  });

  it('should reject block with negative expectedTimeSec', () => {
    const invalidBlock = {
      ...validBlock,
      expectedTimeSec: -10,
    };

    const result = IntroductionI1BlockSchema.safeParse(invalidBlock);
    expect(result.success).toBe(false);
  });

  it('should reject block with non-integer expectedTimeSec', () => {
    const invalidBlock = {
      ...validBlock,
      expectedTimeSec: 180.5,
    };

    const result = IntroductionI1BlockSchema.safeParse(invalidBlock);
    expect(result.success).toBe(false);
  });

  it('should allow unknown fields at top level (no strict mode)', () => {
    const blockWithExtra = {
      ...validBlock,
      customField: 'allowed at top level',
    };

    const result = IntroductionI1BlockSchema.safeParse(blockWithExtra);
    expect(result.success).toBe(true);
  });
});

describe('validateIntroductionI1AIOutput', () => {
  const validOutput = {
    page: {
      badge: 'Introduction Block',
      title: 'Functions in JavaScript',
      subtitle: 'Learn about functions',
      motto: {
        lines: ['Know', 'Your Path.', 'Learn with', 'Purpose.'],
      },
      learningGoal: 'Understand functions',
      topic: {
        title: 'The Topic',
        description: 'Functions explained',
        quote: 'Functions are essential',
      },
      whereFit: {
        title: 'Where Does It Fit?',
        description: 'In JavaScript',
        flowCards: [
          {
            title: 'Functions',
            subtitle: 'Core concept',
            icon: 'code' as const,
          },
        ],
      },
      solution: {
        title: 'The Solution',
        description: 'Use functions',
        code: {
          language: 'javascript',
          code: 'function test() {}',
        },
      },
      whereUsed: {
        title: 'Where Is It Used?',
        description: 'Everywhere',
        useCases: [
          {
            title: 'Web',
            description: 'Web apps',
            icon: 'globe' as const,
          },
        ],
      },
      roadmap: {
        title: 'What Will You Learn?',
        description: 'Learning path',
        steps: [
          {
            title: 'Step 1',
            subtitle: 'Basics',
          },
        ],
      },
      whyMatters: {
        title: 'Why This Matters',
        benefits: [
          {
            title: 'Benefit',
            subtitle: 'Description',
            icon: 'star' as const,
          },
        ],
      },
      keyTakeaway: 'Functions are important',
    },
  };

  it('should validate and return valid AI output', () => {
    const result = validateIntroductionI1AIOutput(validOutput);
    expect(result).toEqual(validOutput);
  });

  it('should throw on invalid AI output', () => {
    const invalidOutput = {
      badge: 'Missing page wrapper',
    };

    expect(() => validateIntroductionI1AIOutput(invalidOutput)).toThrow();
  });
});

