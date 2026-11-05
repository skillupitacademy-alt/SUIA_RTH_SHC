import { expect, it, describe } from 'vitest';
import { domainSchema, subjectSchema, topicSchema, subtopicSchema, skillSchema } from '../hierarchy.schemas';

describe('Domain schema contract', () => {
  it('accepts valid domain with name and category', () => {
    const result = domainSchema.parse({ name: 'Software Engineering', category: 'technical' });
    expect(result.name).toBe('Software Engineering');
    expect(result.category).toBe('technical');
  });

  it('rejects numeric domain name', () => {
    const result = domainSchema.safeParse({ name: 42, category: 'technical' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string name', () => {
    const result = domainSchema.safeParse({ name: '', category: 'technical' });
    expect(result.success).toBe(false);
  });

  it('accepts domain without optional fields', () => {
    const result = domainSchema.parse({ name: 'Domain' });
    expect(result.name).toBe('Domain');
  });
});

describe('Subject schema contract', () => {
  const validUuid = '00000000-0000-4000-8000-000000000001';

  it('accepts valid subject with domainId and name', () => {
    const result = subjectSchema.parse({ domainId: validUuid, name: 'JavaScript' });
    expect(result.domainId).toBe(validUuid);
    expect(result.name).toBe('JavaScript');
  });

  it('rejects invalid UUID for domainId', () => {
    const result = subjectSchema.safeParse({ domainId: 'not-a-uuid', name: 'JavaScript' });
    expect(result.success).toBe(false);
  });

  it('rejects numeric subject name', () => {
    const result = subjectSchema.safeParse({ domainId: validUuid, name: 123 });
    expect(result.success).toBe(false);
  });

  it('accepts valid order value', () => {
    const result = subjectSchema.parse({ domainId: validUuid, name: 'JavaScript', order: 5 });
    expect(result.order).toBe(5);
  });

  it('rejects negative order value', () => {
    const result = subjectSchema.safeParse({ domainId: validUuid, name: 'JavaScript', order: -1 });
    expect(result.success).toBe(false);
  });
});

describe('Topic schema contract', () => {
  const validUuid = '00000000-0000-4000-8000-000000000001';
  const base = { subjectId: validUuid, name: 'Topic' };

  it('accepts valid topic with named complexity', () => {
    const result = topicSchema.parse({ ...base, complexity: 'intermediate' });
    expect(result.complexity).toBe('intermediate');
  });

  it('accepts valid topic with numeric complexityLevel', () => {
    const result = topicSchema.parse({ ...base, complexityLevel: 3 });
    expect(result.complexityLevel).toBe(3);
  });

  it('rejects invalid named complexity', () => {
    const result = topicSchema.safeParse({ ...base, complexity: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects zero complexityLevel', () => {
    const result = topicSchema.safeParse({ ...base, complexityLevel: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects numeric topic name', () => {
    const result = topicSchema.safeParse({ subjectId: validUuid, name: 999 });
    expect(result.success).toBe(false);
  });

  it('accepts valid learningUrl', () => {
    const result = topicSchema.parse({ ...base, learningUrl: 'https://example.com' });
    expect(result.learningUrl).toBe('https://example.com');
  });

  it('accepts empty string for learningUrl', () => {
    const result = topicSchema.parse({ ...base, learningUrl: '' });
    expect(result.learningUrl).toBe('');
  });

  it('rejects invalid URL for learningUrl', () => {
    const result = topicSchema.safeParse({ ...base, learningUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('Subtopic schema contract', () => {
  const validUuid = '00000000-0000-4000-8000-000000000001';

  it('accepts valid subtopic', () => {
    const result = subtopicSchema.parse({ topicId: validUuid, name: 'Subtopic' });
    expect(result.topicId).toBe(validUuid);
    expect(result.name).toBe('Subtopic');
  });

  it('rejects numeric subtopic name', () => {
    const result = subtopicSchema.safeParse({ topicId: validUuid, name: 456 });
    expect(result.success).toBe(false);
  });

  it('accepts valid depthLevel', () => {
    const result = subtopicSchema.parse({ topicId: validUuid, name: 'Subtopic', depthLevel: 2 });
    expect(result.depthLevel).toBe(2);
  });

  it('rejects zero depthLevel', () => {
    const result = subtopicSchema.safeParse({ topicId: validUuid, name: 'Subtopic', depthLevel: 0 });
    expect(result.success).toBe(false);
  });
});

describe('Skill schema contract', () => {
  it('accepts valid skill with name', () => {
    const result = skillSchema.parse({ name: 'Problem Solving' });
    expect(result.name).toBe('Problem Solving');
  });

  it('rejects numeric skill name', () => {
    const result = skillSchema.safeParse({ name: 789 });
    expect(result.success).toBe(false);
  });

  it('accepts valid category', () => {
    const result = skillSchema.parse({ name: 'Debugging', category: 'technical' });
    expect(result.category).toBe('technical');
  });

  it('rejects invalid category', () => {
    const result = skillSchema.safeParse({ name: 'Skill', category: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts valid mappingType', () => {
    const result = skillSchema.parse({ name: 'Algorithm Design', mappingType: 'conceptual' });
    expect(result.mappingType).toBe('conceptual');
  });

  it('rejects invalid mappingType', () => {
    const result = skillSchema.safeParse({ name: 'Skill', mappingType: 'invalid' });
    expect(result.success).toBe(false);
  });
});
