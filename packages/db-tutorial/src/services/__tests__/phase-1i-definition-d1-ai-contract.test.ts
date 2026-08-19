/**
 * Phase 1I — Definition D1 AI Contract Tests
 * 
 * OBJECTIVE: Prove the Definition D1 AI contract generation and validation pipeline
 * 
 * ARCHITECTURE UNDER TEST:
 * 
 * Context (Phase 1E)
 *   ↓
 * buildDefinitionD1AIPrompt() (Phase 1I)
 *   ↓
 * Prompt String
 *   ↓
 * [AI Provider - not tested here]
 *   ↓
 * AI JSON Output ({ page: {...} })
 *   ↓
 * validateDefinitionD1AIOutput() (Phase 1F)
 *   ↓
 * DefinitionD1AuthorContent
 *   ↓
 * buildCanonicalDefinitionD1Block() (Phase 1G)
 *   ↓
 * DefinitionD1Block
 *   ↓
 * buildTutorialDocument() (Phase 1G)
 *   ↓
 * TutorialDocument
 * 
 * CRITICAL VALIDATIONS:
 * ✅ Prompt is deterministic (identical input → identical output)
 * ✅ Prompt contains educational context
 * ✅ Prompt explicitly defines JSON-only output
 * ✅ Prompt prohibits hierarchy metadata
 * ✅ Prompt prohibits block metadata
 * ✅ Prompt prohibits brand metadata
 * ✅ Valid AI fixture passes validation
 * ✅ Valid AI output transforms to canonical D1 block
 * ✅ AI cannot inject hierarchy
 * ✅ AI cannot inject version
 * ✅ AI cannot inject block ID
 * ✅ AI cannot inject brand metadata
 * ✅ Unknown fields are rejected
 * ✅ Full pipeline proven
 */

import { describe, it, expect } from 'vitest';
import { buildDefinitionD1AIPrompt } from '../definition-d1-prompt-generator';
import { buildDefinitionD1AIContext } from '../ai-context-builder';
import {
  validateDefinitionD1AIOutput,
  type DefinitionD1AuthorContent,
  type DefinitionD1Block,
  type TutorialDocument,
} from '@quiz/types';
import { buildCanonicalDefinitionD1Block } from '../canonical-block-builder';
import { buildTutorialDocument } from '../tutorial-document-builder';

describe('Phase 1I — Definition D1 AI Contract', () => {
  // Test context from Phase 1E
  const testContext = buildDefinitionD1AIContext({
    domainId: 'domain-001',
    domainName: 'Full Stack Development',
    subjectId: 'subject-001',
    subjectName: 'Backend Development',
    topicId: 'topic-001',
    topicName: 'Python',
    subtopicId: 'subtopic-001',
    subtopicName: 'What Is a Variable?',
    skillIds: [],
  });

  // Valid AI output fixture (what AI should return)
  const validAIOutput = {
    page: {
      type: 'definition' as const,
      category: 'Python Fundamentals',
      title: 'What Is a Variable?',
      intro: 'A variable is a name given to a value or object in memory, providing a way to store and retrieve data in your programs.',
      definition: 'A variable is a symbolic name that refers to an object stored in memory. In Python, variables are created through assignment and can reference objects of any type.',
      explanation: [
        'Python binds a name to an object using the assignment operator (=).',
        'The name can later refer to a different object through reassignment.',
        'Variables do not have fixed types; the object they reference determines the type.',
      ],
      example: {
        language: 'python',
        code: 'x = 10\nprint(x)  # Output: 10\n\nx = "Hello"\nprint(x)  # Output: Hello',
      },
      characteristics: [
        {
          icon: '○',
          title: 'Named Reference',
          description: 'A variable is a name that refers to an object in memory.',
        },
        {
          icon: '◆',
          title: 'Dynamic Typing',
          description: 'Variables can refer to objects of any type without type declarations.',
        },
      ],
      takeaway: 'A variable is a name that refers to an object in memory, providing a flexible way to store and manipulate data in Python.',
    },
  };

  describe('Phase 1I-A: Prompt Generation', () => {
    it('TEST 1 — should generate prompt with educational context', () => {
      const prompt = buildDefinitionD1AIPrompt(testContext);

      // ✅ VERIFY: Prompt contains hierarchy context
      expect(prompt).toContain('Full Stack Development'); // domain
      expect(prompt).toContain('Backend Development'); // subject
      expect(prompt).toContain('Python'); // topic
      expect(prompt).toContain('What Is a Variable?'); // subtopic

      // ✅ VERIFY: Prompt specifies block type and version
      expect(prompt).toContain('Definition');
      expect(prompt).toContain('D1');
    });

    it('TEST 2 — should explicitly define JSON contract', () => {
      const prompt = buildDefinitionD1AIPrompt(testContext);

      // ✅ VERIFY: Prompt requires JSON output
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('json');

      // ✅ VERIFY: Prompt specifies structure
      expect(prompt).toContain('"page"');
      expect(prompt).toContain('"type"');
      expect(prompt).toContain('"category"');
      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"definition"');

      // ✅ VERIFY: Prompt prohibits non-JSON formats
      expect(prompt).toContain('Do NOT');
      expect(prompt.toLowerCase()).toContain('markdown');
    });

    it('TEST 3 — should prohibit hierarchy metadata', () => {
      const prompt = buildDefinitionD1AIPrompt(testContext);

      // ✅ VERIFY: Prompt explicitly prohibits hierarchy IDs
      expect(prompt).toContain('domainId');
      expect(prompt).toContain('subjectId');
      expect(prompt).toContain('topicId');
      expect(prompt).toContain('subtopicId');
      expect(prompt).toContain('MUST NOT');
    });

    it('TEST 4 — should prohibit block metadata', () => {
      const prompt = buildDefinitionD1AIPrompt(testContext);

      // ✅ VERIFY: Prompt prohibits system-controlled metadata
      expect(prompt).toContain('id');
      expect(prompt).toContain('blockId');
      expect(prompt).toContain('version');

      // ✅ VERIFY: Prohibitions are explicit
      const lowerPrompt = prompt.toLowerCase();
      expect(lowerPrompt).toContain('must not');
    });

    it('TEST 5 — should prohibit brand metadata', () => {
      const prompt = buildDefinitionD1AIPrompt(testContext);

      // ✅ VERIFY: Prompt prohibits brand/theme
      expect(prompt).toContain('brandId');
      expect(prompt).toContain('theme');
    });

    it('TEST 6 — should be deterministic', () => {
      // ✅ VERIFY: Identical input produces identical output
      const prompt1 = buildDefinitionD1AIPrompt(testContext);
      const prompt2 = buildDefinitionD1AIPrompt(testContext);

      expect(prompt1).toBe(prompt2);
    });

    it('TEST 7 — should include educational quality requirements', () => {
      const prompt = buildDefinitionD1AIPrompt(testContext);

      // ✅ VERIFY: Educational guidelines present
      expect(prompt.toLowerCase()).toContain('educational');
      expect(prompt.toLowerCase()).toContain('accuracy'); // looks for "accuracy" section header
      expect(prompt.toLowerCase()).toContain('example');
    });

    it('TEST 8 — should specify output format', () => {
      const prompt = buildDefinitionD1AIPrompt(testContext);

      // ✅ VERIFY: Output format specified
      expect(prompt).toContain('json'); // format
      expect(prompt).toContain('page'); // root key
    });
  });

  describe('Phase 1I-B: AI Output Validation', () => {
    it('TEST 9 — valid AI fixture conforms to validator', () => {
      // ✅ VERIFY: Valid output passes Phase 1F validation
      const authorContent: DefinitionD1AuthorContent = validateDefinitionD1AIOutput(validAIOutput);

      expect(authorContent.page.type).toBe('definition');
      expect(authorContent.page.category).toBe('Python Fundamentals');
      expect(authorContent.page.title).toBe('What Is a Variable?');
      expect(authorContent.page.definition).toBeTruthy();
      expect(authorContent.page.explanation).toHaveLength(3);
      expect(authorContent.page.example.language).toBe('python');
      expect(authorContent.page.characteristics).toHaveLength(2);
      expect(authorContent.page.takeaway).toBeTruthy();
    });

    it('TEST 10 — valid AI output becomes canonical D1 block', () => {
      // ✅ VERIFY: AI output → Canonical pipeline
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);
      const block: DefinitionD1Block = buildCanonicalDefinitionD1Block(authorContent);

      // ✅ VERIFY: Canonical envelope
      expect(block.type).toBe('definition');
      expect(block.version).toBe('D1');
      expect(block.id).toBeTruthy();

      // ✅ VERIFY: Content preserved
      expect(block.content).toEqual(authorContent);
    });
  });

  describe('Phase 1I-C: Security Boundary', () => {
    it('TEST 11 — AI cannot create hierarchy', () => {
      const maliciousOutput = {
        domainId: 'attacker-domain',
        subjectId: 'attacker-subject',
        topicId: 'attacker-topic',
        subtopicId: 'attacker-subtopic',
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Phase 1F validator rejects hierarchy injection
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('TEST 12 — AI cannot inject version', () => {
      const maliciousOutput = {
        version: 'D999',
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Version injection rejected
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('TEST 13 — AI cannot inject block ID', () => {
      const maliciousOutput = {
        blockId: 'attacker-block-id',
        id: 'attacker-id',
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Block ID injection rejected
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('TEST 14 — AI cannot inject brand metadata', () => {
      const maliciousOutput = {
        brandId: 'attacker-brand',
        theme: { primary: '#ff0000' },
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Brand metadata rejected
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('TEST 15 — AI cannot inject system metadata', () => {
      const maliciousOutput = {
        page: validAIOutput.page,
        schemaVersion: 999,
        status: 'deployed',
        publishedAt: new Date().toISOString(),
        generatedByAi: true,
        aiModelUsed: 'attacker-model',
        qualityScore: 100,
      };

      // ✅ VERIFY: System metadata rejected
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('TEST 16 — unknown fields rejected (strict mode)', () => {
      const maliciousOutput = {
        page: validAIOutput.page,
        maliciousField: 'should-be-rejected',
        unknownProperty: 'attack',
      };

      // ✅ VERIFY: Strict mode rejects unknown fields
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('TEST 17 — AI cannot inject hierarchy inside page', () => {
      const maliciousOutput = {
        page: {
          ...validAIOutput.page,
          domainId: 'attacker-domain',
          subtopicId: 'attacker-subtopic',
        },
      };

      // ✅ VERIFY: Hierarchy inside page rejected
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('Phase 1I-D: Full Pipeline Integration', () => {
    it('TEST 18 — complete Phase 1I pipeline', () => {
      // Step 1: Phase 1E - Build context
      const context = buildDefinitionD1AIContext({
        domainId: 'domain-001',
        domainName: 'Full Stack Development',
        subjectId: 'subject-001',
        subjectName: 'Backend Development',
        topicId: 'topic-001',
        topicName: 'Python',
        subtopicId: 'subtopic-001',
        subtopicName: 'What Is a Variable?',
        skillIds: [],
      });

      // ✅ VERIFY: Context created
      expect(context.context.domainName).toBe('Full Stack Development');
      expect(context.block.type).toBe('definition');
      expect(context.block.version).toBe('D1');

      // Step 2: Phase 1I - Generate prompt
      const prompt = buildDefinitionD1AIPrompt(context);

      // ✅ VERIFY: Prompt generated
      expect(prompt).toBeTruthy();
      expect(prompt).toContain('Definition D1');
      expect(prompt).toContain('Python');

      // Step 3: [AI Provider generates output - simulated with fixture]
      const aiOutput = validAIOutput;

      // Step 4: Phase 1F - Validate AI output
      const authorContent: DefinitionD1AuthorContent = validateDefinitionD1AIOutput(aiOutput);

      // ✅ VERIFY: Validation passed
      expect(authorContent.page.type).toBe('definition');

      // Step 5: Phase 1G - Build canonical block
      const block: DefinitionD1Block = buildCanonicalDefinitionD1Block(authorContent);

      // ✅ VERIFY: Canonical block created
      expect(block.id).toBeTruthy();
      expect(block.type).toBe('definition');
      expect(block.version).toBe('D1');
      expect(block.content).toEqual(authorContent);

      // Step 6: Phase 1G - Build tutorial document
      const document: TutorialDocument = buildTutorialDocument([block]);

      // ✅ VERIFY: Document created
      expect(document.schemaVersion).toBe(1);
      expect(document.blocks).toHaveLength(1);
      expect(document.blocks[0]).toEqual(block);

      // ✅ VERIFY: Full pipeline integrity
      const retrievedBlock = document.blocks[0] as DefinitionD1Block;
      expect(retrievedBlock.version).toBe('D1');
      expect(retrievedBlock.content.page.title).toBe('What Is a Variable?');
    });

    it('TEST 19 — document with multiple D1 blocks', () => {
      const authorContent1 = validateDefinitionD1AIOutput({
        page: {
          ...validAIOutput.page,
          title: 'First Definition',
        },
      });

      const authorContent2 = validateDefinitionD1AIOutput({
        page: {
          ...validAIOutput.page,
          title: 'Second Definition',
        },
      });

      const block1 = buildCanonicalDefinitionD1Block(authorContent1);
      const block2 = buildCanonicalDefinitionD1Block(authorContent2);

      const document = buildTutorialDocument([block1, block2]);

      // ✅ VERIFY: Multiple D1 blocks supported
      expect(document.blocks).toHaveLength(2);
      
      const d1Block1 = document.blocks[0] as DefinitionD1Block;
      const d1Block2 = document.blocks[1] as DefinitionD1Block;

      expect(d1Block1.version).toBe('D1');
      expect(d1Block2.version).toBe('D1');
      expect(d1Block1.content.page.title).toBe('First Definition');
      expect(d1Block2.content.page.title).toBe('Second Definition');
    });

    it('TEST 20 — prompt contract does not bypass validator', () => {
      // ✅ VERIFY: Even if prompt says "don't include X", validator enforces it
      
      // Simulate AI ignoring prompt instructions
      const maliciousOutput = {
        version: 'D2', // AI ignores prompt and adds version
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Validator catches it regardless of prompt
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();

      // CRITICAL: Prompt is NOT the security boundary
      // validateDefinitionD1AIOutput() is the actual trust boundary
    });
  });

  describe('Phase 1I-E: Content Preservation', () => {
    it('TEST 21 — all page fields preserved through pipeline', () => {
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);
      const block = buildCanonicalDefinitionD1Block(authorContent);
      const document = buildTutorialDocument([block]);

      const retrievedBlock = document.blocks[0] as DefinitionD1Block;

      // ✅ VERIFY: All page fields intact
      expect(retrievedBlock.content.page.type).toBe(validAIOutput.page.type);
      expect(retrievedBlock.content.page.category).toBe(validAIOutput.page.category);
      expect(retrievedBlock.content.page.title).toBe(validAIOutput.page.title);
      expect(retrievedBlock.content.page.intro).toBe(validAIOutput.page.intro);
      expect(retrievedBlock.content.page.definition).toBe(validAIOutput.page.definition);
      expect(retrievedBlock.content.page.explanation).toEqual(validAIOutput.page.explanation);
      expect(retrievedBlock.content.page.example).toEqual(validAIOutput.page.example);
      expect(retrievedBlock.content.page.characteristics).toEqual(validAIOutput.page.characteristics);
      expect(retrievedBlock.content.page.takeaway).toBe(validAIOutput.page.takeaway);
    });

    it('TEST 22 — system metadata added by canonical builder, not AI', () => {
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);

      // ✅ VERIFY: Author content has NO system metadata
      expect((authorContent as any).id).toBeUndefined();
      expect((authorContent as any).version).toBeUndefined();
      expect((authorContent as any).type).toBeUndefined();

      const block = buildCanonicalDefinitionD1Block(authorContent);

      // ✅ VERIFY: Canonical builder ADDS system metadata
      expect(block.id).toBeTruthy();
      expect(block.type).toBe('definition');
      expect(block.version).toBe('D1');
    });
  });

  describe('Phase 1I-F: Architectural Boundary', () => {
    it('TEST 23 — AI output is DefinitionD1AuthorContent, NOT DefinitionD1Block', () => {
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);

      // ✅ VERIFY: AI output structure
      expect(authorContent).toHaveProperty('page');
      expect(authorContent.page).toHaveProperty('type');
      expect(authorContent.page).toHaveProperty('title');

      // ✅ VERIFY: AI output does NOT have block envelope
      expect((authorContent as any).id).toBeUndefined();
      expect((authorContent as any).version).toBeUndefined();

      // Only after canonical builder:
      const block = buildCanonicalDefinitionD1Block(authorContent);
      expect(block.id).toBeTruthy();
      expect(block.version).toBe('D1');
    });

    it('TEST 24 — prompt determinism with different contexts', () => {
      const context1 = buildDefinitionD1AIContext({
        domainId: 'domain-001',
        domainName: 'Programming',
        subjectId: 'subject-001',
        subjectName: 'Python',
        topicId: 'topic-001',
        topicName: 'Variables',
        subtopicId: 'subtopic-001',
        subtopicName: 'What Is a Variable?',
        skillIds: [],
      });

      const context2 = buildDefinitionD1AIContext({
        domainId: 'domain-002',
        domainName: 'Web Development',
        subjectId: 'subject-002',
        subjectName: 'JavaScript',
        topicId: 'topic-002',
        topicName: 'Data Types',
        subtopicId: 'subtopic-002',
        subtopicName: 'Understanding Strings',
        skillIds: [],
      });

      const prompt1a = buildDefinitionD1AIPrompt(context1);
      const prompt1b = buildDefinitionD1AIPrompt(context1);
      const prompt2 = buildDefinitionD1AIPrompt(context2);

      // ✅ VERIFY: Same context → same prompt
      expect(prompt1a).toBe(prompt1b);

      // ✅ VERIFY: Different context → different prompt
      expect(prompt1a).not.toBe(prompt2);
      expect(prompt2).toContain('JavaScript');
      expect(prompt2).toContain('Understanding Strings');
    });
  });
});
