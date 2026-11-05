import { expect, it } from 'vitest';
import { topicSchema } from '../hierarchy.schemas';
const base = { subjectId: '00000000-0000-4000-8000-000000000001', name: 'Topic' };
it('retains an explicitly supplied numeric complexity level', () => {
  expect(topicSchema.parse({ ...base, complexityLevel: 3 }).complexityLevel).toBe(3);
});
it('rejects an invalid numeric complexity level', () => {
  expect(topicSchema.safeParse({ ...base, complexityLevel: 0 }).success).toBe(false);
});
it('does not silently discard the caller selected named complexity', () => {
  const result = topicSchema.safeParse({ ...base, complexity: 'expert' });
  expect(result.success === false || (result.data as Record<string, unknown>).complexity === 'expert' || result.data.complexityLevel !== undefined).toBe(true);
});
