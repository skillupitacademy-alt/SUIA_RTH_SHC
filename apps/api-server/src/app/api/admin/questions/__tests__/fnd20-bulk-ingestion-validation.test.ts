import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { bulkQuestionSchema } from '@/schemas/admin.schemas';

beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });

const validBase = {
  topicId: '11111111-1111-4111-8111-111111111111',
  questions: [{
    questionText: 'What is 2+2?',
    type: 'mcq' as const,
    options: [
      { id: '1', text: 'Three', isCorrect: false },
      { id: '2', text: 'Four', isCorrect: true },
    ]
  }]
};

describe('FND20 bulk question ingestion validation', () => {
  describe('missing or invalid question IDs', () => {
    it('accepts bulk questions without explicit IDs (schema does not require option.id)', () => {
      const payload = {
        ...validBase,
        questions: [{
          questionText: 'Question',
          type: 'mcq' as const,
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
          ]
        }]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('accepts string array options (legacy representation)', () => {
      const payload = {
        ...validBase,
        questions: [{
          questionText: 'Question',
          type: 'mcq' as const,
          options: ['Alpha', 'Beta']
        }]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects empty option text and code (option must have content)', () => {
      const payload = {
        ...validBase,
        questions: [{
          questionText: 'Question',
          type: 'mcq' as const,
          options: [
            { id: '1', text: '', code: '', isCorrect: true }
          ]
        }]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('malformed question types', () => {
    it('rejects unsupported question type', () => {
      const payload = {
        ...validBase,
        questions: [{
          questionText: 'Question',
          type: 'unsupported_type' as never,
          options: ['A', 'B']
        }]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('accepts all supported types: mcq, code_mcq, multi_select', () => {
      for (const type of ['mcq', 'code_mcq', 'multi_select'] as const) {
        const payload = {
          ...validBase,
          questions: [{
            questionText: 'Question',
            type,
            options: ['A', 'B']
          }]
        };
        const result = bulkQuestionSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('malformed options array', () => {
    it('rejects empty options array', () => {
      const payload = {
        ...validBase,
        questions: [{
          questionText: 'Question',
          type: 'mcq' as const,
          options: []
        }]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects missing options', () => {
      const payload = {
        ...validBase,
        questions: [{
          questionText: 'Question',
          type: 'mcq' as const,
        }] as never
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('accepts mixed string and object options', () => {
      const payload = {
        ...validBase,
        questions: [{
          questionText: 'Question',
          type: 'mcq' as const,
          options: [
            'String option',
            { text: 'Object option', isCorrect: true }
          ]
        }]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('rejects missing topicId', () => {
      const payload = {
        questions: [{
          questionText: 'Question',
          type: 'mcq' as const,
          options: ['A', 'B']
        }]
      } as never;
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects invalid UUID format in topicId', () => {
      const payload = {
        topicId: 'not-a-uuid',
        questions: [{
          questionText: 'Question',
          type: 'mcq' as const,
          options: ['A', 'B']
        }]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects empty or blank questionText', () => {
      const payload = {
        ...validBase,
        questions: [{
          questionText: '',
          type: 'mcq' as const,
          options: ['A', 'B']
        }]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects questions array being empty', () => {
      const payload = {
        topicId: '11111111-1111-4111-8111-111111111111',
        questions: []
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('optional context fields', () => {
    it('accepts subtopicId when provided', () => {
      const payload = {
        ...validBase,
        subtopicId: '22222222-2222-4222-8222-222222222222'
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('accepts skillIds array', () => {
      const payload = {
        ...validBase,
        skillIds: ['33333333-3333-4333-8333-333333333333']
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID in skillIds', () => {
      const payload = {
        ...validBase,
        skillIds: ['invalid-uuid']
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('complex multi-question validation', () => {
    it('validates all questions in batch', () => {
      const payload = {
        topicId: '11111111-1111-4111-8111-111111111111',
        questions: [
          { questionText: 'Q1', type: 'mcq' as const, options: ['A', 'B'] },
          { questionText: 'Q2', type: 'multi_select' as const, options: [{ text: 'X', isCorrect: true }, { text: 'Y' }] },
          { questionText: 'Q3', type: 'code_mcq' as const, options: [{ code: 'fn()', isCorrect: true }] },
        ]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects batch if any single question is invalid', () => {
      const payload = {
        topicId: '11111111-1111-4111-8111-111111111111',
        questions: [
          { questionText: 'Q1', type: 'mcq' as const, options: ['A', 'B'] },
          { questionText: 'Q2', type: 'invalid' as never, options: ['X', 'Y'] },
        ]
      };
      const result = bulkQuestionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
