/**
 * Phase 2B — Code C1 AI Contract Tests
 * 
 * OBJECTIVE: Prove the Code C1 AI contract generation and validation pipeline
 * 
 * ARCHITECTURE UNDER TEST:
 * 
 * Context (Phase 2B Batch 1)
 *   ↓
 * buildCodeC1AIPrompt() (Phase 2B Batch 1)
 *   ↓
 * Prompt String
 *   ↓
 * [AI Provider - not tested here]
 *   ↓
 * AI JSON Output ({ page: {...} })
 *   ↓
 * validateCodeC1AIOutput() (Phase 2A)
 *   ↓
 * CodeC1AuthorContent
 * 
 * CRITICAL VALIDATIONS:
 * ✅ Context builder validates hierarchy completeness
 * ✅ Context builder is deterministic
 * ✅ Prompt is deterministic (identical input → identical output)
 * ✅ Prompt contains educational context
 * ✅ Prompt explicitly defines JSON-only output
 * ✅ Prompt contains all frozen field constraints
 * ✅ Prompt prohibits hierarchy metadata
 * ✅ Prompt prohibits block metadata
 * ✅ Prompt prohibits brand metadata
 * ✅ Valid AI fixture passes validation
 * ✅ AI cannot inject hierarchy
 * ✅ AI cannot inject version
 * ✅ AI cannot inject block ID
 * ✅ AI cannot inject brand metadata
 * ✅ Unknown fields are rejected
 */

import { describe, it, expect } from 'vitest';
import { buildCodeC1AIPrompt } from '../code-c1-prompt-generator';
import { buildCodeC1AIContext, type ComposerSelection } from '../ai-context-builder';
import { validateCodeC1AIOutput } from '@quiz/types';

describe('Phase 2B — Code C1 AI Contract', () => {
  const validSelection: ComposerSelection = {
    domainId: 'domain-001',
    domainName: 'Full Stack Development',
    subjectId: 'subject-001',
    subjectName: 'Backend Development',
    topicId: 'topic-001',
    topicName: 'Python',
    subtopicId: 'subtopic-001',
    subtopicName: 'Hello World',
    skillIds: [],
  };

  const testContext = buildCodeC1AIContext(validSelection);

  // ============================================================
  // CONTEXT BUILDER TESTS
  // ============================================================

  describe('Context Builder — buildCodeC1AIContext', () => {
    it('TEST 1 — should produce valid context from complete selection', () => {
      const context = buildCodeC1AIContext(validSelection);

      expect(context.context.domainId).toBe('domain-001');
      expect(context.context.domainName).toBe('Full Stack Development');
      expect(context.context.subjectId).toBe('subject-001');
      expect(context.context.subjectName).toBe('Backend Development');
      expect(context.context.topicId).toBe('topic-001');
      expect(context.context.topicName).toBe('Python');
      expect(context.context.subtopicId).toBe('subtopic-001');
      expect(context.context.subtopicName).toBe('Hello World');
      expect(context.block.type).toBe('code');
      expect(context.block.version).toBe('C1');
      expect(context.output.format).toBe('json');
      expect(context.output.rootKey).toBe('page');
    });

    it('TEST 2 — should reject incomplete hierarchy IDs', () => {
      const incompleteSelection: ComposerSelection = {
        domainId: 'domain-001',
        subjectId: null,
        topicId: 'topic-001',
        subtopicId: 'subtopic-001',
        domainName: 'Full Stack Development',
        subjectName: 'Backend Development',
        topicName: 'Python',
        subtopicName: 'Hello World',
        skillIds: [],
      };

      expect(() => buildCodeC1AIContext(incompleteSelection)).toThrow(
        '[CodeC1AIContext] Complete hierarchy selection is required'
      );
    });

    it('TEST 3 — should reject missing hierarchy names', () => {
      const incompleteSelection: ComposerSelection = {
        domainId: 'domain-001',
        subjectId: 'subject-001',
        topicId: 'topic-001',
        subtopicId: 'subtopic-001',
        domainName: 'Full Stack Development',
        subjectName: undefined,
        topicName: 'Python',
        subtopicName: 'Hello World',
        skillIds: [],
      };

      expect(() => buildCodeC1AIContext(incompleteSelection)).toThrow(
        '[CodeC1AIContext] Complete hierarchy names are required'
      );
    });

    it('TEST 4 — should be deterministic', () => {
      const context1 = buildCodeC1AIContext(validSelection);
      const context2 = buildCodeC1AIContext(validSelection);

      expect(context1).toEqual(context2);
    });

    it('TEST 5 — should not include skillIds in context', () => {
      const context = buildCodeC1AIContext(validSelection);

      expect(context).not.toHaveProperty('skillIds');
      expect(context.context).not.toHaveProperty('skillIds');
    });
  });

  // ============================================================
  // PROMPT GENERATION TESTS
  // ============================================================

  describe('Prompt Generator — buildCodeC1AIPrompt', () => {
    it('TEST 6 — should generate prompt with educational context', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      // ✅ VERIFY: Prompt contains hierarchy context
      expect(prompt).toContain('Full Stack Development');
      expect(prompt).toContain('Backend Development');
      expect(prompt).toContain('Python');
      expect(prompt).toContain('Hello World');
    });

    it('TEST 7 — should explicitly define JSON contract', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      // ✅ VERIFY: Prompt requires JSON output
      expect(prompt).toContain('"page"');
      expect(prompt).toContain('"type": "code"');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('json');
    });

    it('TEST 8 — should contain all frozen field constraints', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      // ✅ VERIFY: Frozen constraints are documented in prompt
      expect(prompt).toContain('title');
      expect(prompt).toContain('10-150');
      expect(prompt).toContain('introduction');
      expect(prompt).toContain('50-500');
      expect(prompt).toContain('language');
      expect(prompt).toContain('code');
      expect(prompt).toContain('10-2000');
      expect(prompt).toContain('filename');
      expect(prompt).toContain('1-100');
      expect(prompt).toContain('explanation');
      expect(prompt).toContain('2-6');
      expect(prompt).toContain('focus');
      expect(prompt).toContain('5-100');
      expect(prompt).toContain('description');
      expect(prompt).toContain('20-300');
      expect(prompt).toContain('output');
      expect(prompt).toContain('1-500');
      expect(prompt).toContain('0-200');
      expect(prompt).toContain('takeaway');
      expect(prompt).toContain('20-200');
      expect(prompt).toContain('practiceHint');
    });

    it('TEST 9 — should prohibit hierarchy metadata', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      // ✅ VERIFY: Prompt explicitly prohibits hierarchy IDs
      expect(prompt).toContain('domainId');
      expect(prompt).toContain('subjectId');
      expect(prompt).toContain('topicId');
      expect(prompt).toContain('subtopicId');
      expect(prompt).toContain('MUST NOT');
    });

    it('TEST 10 — should prohibit block metadata', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      // ✅ VERIFY: Prompt prohibits system-controlled metadata
      expect(prompt).toContain('id');
      expect(prompt).toContain('blockId');
      expect(prompt).toContain('version');
      expect(prompt).toContain('MUST NOT');
    });

    it('TEST 11 — should prohibit brand metadata', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      // ✅ VERIFY: Prompt prohibits brand/theme
      expect(prompt).toContain('brandId');
      expect(prompt).toContain('theme');
    });

    it('TEST 12 — should specify output format', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      // ✅ VERIFY: Output format specified
      expect(prompt).toContain('json');
      expect(prompt).toContain('page');
    });

    it('TEST 13 — should include educational quality requirements', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      // ✅ VERIFY: Educational guidelines present
      expect(prompt).toContain('syntactically valid');
      expect(prompt).toContain('beginner');
      expect(prompt).toContain('runnable');
    });

    it('TEST 14 — should be deterministic', () => {
      // ✅ VERIFY: Identical input produces identical output
      const prompt1 = buildCodeC1AIPrompt(testContext);
      const prompt2 = buildCodeC1AIPrompt(testContext);

      expect(prompt1).toBe(prompt2);
    });

    it('TEST 15 — should require pure JSON without Markdown', () => {
      const prompt = buildCodeC1AIPrompt(testContext);

      expect(prompt).toContain('Do NOT wrap in Markdown');
      expect(prompt).toContain('Do NOT include comments');
      expect(prompt).toContain('JSON.parse()');
    });
  });

  // ============================================================
  // VALIDATOR INTEGRATION TESTS
  // ============================================================

  describe('Validator Integration — Representative AI Output', () => {
    const validAIOutput = {
      page: {
        type: 'code' as const,
        title: 'Hello World in Python',
        introduction: 'This example demonstrates the simplest Python program that prints a message to the console.',
        language: 'python',
        code: 'print("Hello, World!")',
        filename: 'hello.py',
        explanation: [
          {
            focus: 'print() function',
            description: 'The print() function outputs text to the console. It is the most basic way to display information in Python.',
          },
          {
            focus: 'String literal',
            description: 'Text enclosed in quotes is a string literal. Python treats it as data to be displayed, not as code.',
          },
        ],
        output: {
          value: 'Hello, World!',
          description: 'The text appears in the console',
        },
        takeaway: 'The print() function is your first tool for displaying output in Python.',
        practiceHint: 'Try changing the message to print your own text.',
      },
    };

    it('TEST 16 — should accept valid representative AI output', () => {
      expect(() => validateCodeC1AIOutput(validAIOutput)).not.toThrow();
    });

    it('TEST 17 — should return CodeC1AuthorContent type', () => {
      const result = validateCodeC1AIOutput(validAIOutput);
      expect(result).toHaveProperty('page');
      expect(result.page).toHaveProperty('type');
      expect(result.page).toHaveProperty('title');
      expect(result.page).toHaveProperty('introduction');
      expect(result.page).toHaveProperty('code');
    });

    it('TEST 18 — should reject if AI adds domainId at root', () => {
      const malicious = {
        domainId: 'domain-001',
        page: validAIOutput.page,
      };
      expect(() => validateCodeC1AIOutput(malicious)).toThrow();
    });

    it('TEST 19 — should reject if AI adds version at root', () => {
      const malicious = {
        version: 'C1',
        page: validAIOutput.page,
      };
      expect(() => validateCodeC1AIOutput(malicious)).toThrow();
    });

    it('TEST 20 — should reject if AI adds blockId at root', () => {
      const malicious = {
        blockId: '550e8400-e29b-41d4-a716-446655440000',
        page: validAIOutput.page,
      };
      expect(() => validateCodeC1AIOutput(malicious)).toThrow();
    });

    it('TEST 21 — should reject if AI adds brandId', () => {
      const malicious = {
        brandId: 'rth',
        page: validAIOutput.page,
      };
      expect(() => validateCodeC1AIOutput(malicious)).toThrow();
    });

    it('TEST 22 — should reject unknown field at root', () => {
      const malicious = {
        page: validAIOutput.page,
        unknownField: 'should be rejected',
      };
      expect(() => validateCodeC1AIOutput(malicious)).toThrow();
    });

    it('TEST 23 — should reject unknown field inside page', () => {
      const malicious = {
        page: {
          ...validAIOutput.page,
          unknownField: 'should be rejected',
        },
      };
      expect(() => validateCodeC1AIOutput(malicious)).toThrow();
    });

    it('TEST 24 — should accept minimum valid output (no optionals)', () => {
      const minimalOutput = {
        page: {
          type: 'code' as const,
          title: 'Basic Example',
          introduction: 'This is a minimal valid example with only required fields present.',
          language: 'javascript',
          code: 'console.log("test");',
          explanation: [
            {
              focus: 'console.log',
              description: 'Outputs a message to the console.',
            },
            {
              focus: 'string',
              description: 'The message is a string literal.',
            },
          ],
          takeaway: 'Console.log displays output.',
        },
      };

      expect(() => validateCodeC1AIOutput(minimalOutput)).not.toThrow();
    });

    it('TEST 25 — should accept all 15 supported languages', () => {
      const languages = [
        'javascript', 'typescript', 'python', 'java', 'sql',
        'bash', 'scala', 'go', 'rust', 'cpp',
        'csharp', 'php', 'ruby', 'swift', 'kotlin',
      ];

      languages.forEach((language) => {
        const output = {
          page: {
            ...validAIOutput.page,
            language,
          },
        };
        expect(() => validateCodeC1AIOutput(output)).not.toThrow();
      });
    });
  });
});
