import { describe, expect, it, vi } from 'vitest';
import { mockDb } from '../../../__test-utils__/mock-db';
import { HierarchyFactory } from '../hierarchy.factory';

// Mock DB globally
vi.mock('@quiz/db', () => ({
  db: mockDb,
  domains: { name: 'domains.name', id: 'domains.id' },
  subjects: { domainId: 'subjects.domainId', name: 'subjects.name', id: 'subjects.id' },
  topics: { subjectId: 'topics.subjectId', name: 'topics.name', id: 'topics.id' },
  subtopics: { topicId: 'subtopics.topicId', name: 'subtopics.name', id: 'subtopics.id' },
  skills: { name: 'skills.name', id: 'skills.id' },
  questions: { topicId: 'questions.topicId', id: 'questions.id' },
  questionSkills: { questionId: 'questionSkills.questionId', skillId: 'questionSkills.skillId' },
}));

describe('HierarchyFactory - Atomic Upsert', () => {

  it('performs an atomic upsert of a nested hierarchy', async () => {
    const payload = {
      domainName: 'Cloud Computing',
      subjects: [{
        name: 'AWS',
        topics: [{
          name: 'EC2',
          questions: [{
            questionText: 'What is EC2?',
            skillNames: ['Virtualization']
          }]
        }]
      }]
    };

    // Setup mocks for resolveDomain
    vi.mocked(mockDb.query.domains.findFirst).mockResolvedValueOnce(undefined); // New domain
    
    // Setup sequence of inserts: Domain -> Subject -> Topic -> Questions -> Skill -> questionSkills
    vi.mocked(mockDb.insert)
      .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'd-1' }]) }) } as any) // domains
      .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 's-1' }]) }) } as any) // subjects
      .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 't-1' }]) }) } as any) // topics
      .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'q-1', difficulty: 'simple' }]) }) } as any) // questions
      .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'sk-1' }]) }) } as any) // skills
      .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{}]) }) } as any); // questionSkills

    vi.mocked(mockDb.query.subjects.findFirst).mockResolvedValueOnce(undefined);
    vi.mocked(mockDb.query.topics.findFirst).mockResolvedValueOnce(undefined);
    vi.mocked(mockDb.query.skills.findFirst).mockResolvedValueOnce(undefined);

    const results = await HierarchyFactory.atomicUpsert(payload);

    expect(results.domainId).toBe('d-1');
    expect(results.stats.domains.added).toBe(1);
    expect(results.stats.subjects.added).toBe(1);
    expect(results.stats.topics.added).toBe(1);
    expect(results.questionIds).toContain('q-1');
  });

  it('throws error if domain context is missing', async () => {
    const payload = {
      subjects: [{ name: 'orphaned' }]
    };
    await expect(HierarchyFactory.atomicUpsert(payload)).rejects.toThrow('Domain ID, Domain Name, batchDomains, or batchSkills required');
  });

});
