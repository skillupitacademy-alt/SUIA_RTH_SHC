import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { bulkQuestionSchema, questionSchema } from '@/schemas/admin.schemas';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });
const valid = { topicId: '11111111-1111-4111-8111-111111111111', questionText: 'A question?', type: 'mcq', options: ['One', 'Two'] };
describe('actual admin question schema', () => {
  it('accepts the current single and bulk payload', () => {
    expect(questionSchema.safeParse(valid).success).toBe(true);
    expect(bulkQuestionSchema.safeParse({ topicId: valid.topicId, questions: [{ questionText: valid.questionText, type: valid.type, options: valid.options }] }).success).toBe(true);
  });
  it('rejects unknown type and missing options', () => {
    expect(questionSchema.safeParse({ ...valid, type: 'unknown' }).success).toBe(false);
    expect(questionSchema.safeParse({ ...valid, options: [] }).success).toBe(false);
    expect(bulkQuestionSchema.safeParse({ topicId: valid.topicId, questions: [{ ...valid, type: 'unknown' }] }).success).toBe(false);
  });
});
