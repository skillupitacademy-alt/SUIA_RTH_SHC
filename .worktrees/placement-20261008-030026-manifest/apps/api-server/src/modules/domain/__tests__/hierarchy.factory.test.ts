import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HierarchyFactory } from '../hierarchy.factory';

const { mockDb, mockTx } = vi.hoisted(() => {
  const tx = {
    query: {
        domains: { findFirst: vi.fn(), findMany: vi.fn() },
        subjects: { findFirst: vi.fn(), findMany: vi.fn() },
        topics: { findFirst: vi.fn(), findMany: vi.fn() },
        subtopics: { findFirst: vi.fn(), findMany: vi.fn() },
        skills: { findMany: vi.fn() }
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  } as any;

  const db = {
    transaction: vi.fn(async (cb) => cb(tx)),
    domains: { name: 'domains_name', description: 'domains_desc', id: 'domains_id' },
    subjects: { id: 'subjects_id', name: 'subjects_name', domainId: 'subjects_domainId' },
    topics: { id: 'topics_id', name: 'topics_name', subjectId: 'topics_subjectId' },
    subtopics: { id: 'subtopics_id', name: 'subtopics_name', topicId: 'subtopics_topicId' },
    questions: { id: 'questions_id', status: 'questions_status' },
    skills: { id: 'skills_id', name: 'skills_name' },
    questionSkills: { questionId: 'qs_qid', skillId: 'qs_sid' }
  } as any;
  return { mockDb: db, mockTx: tx };
});

vi.mock('@quiz/db', () => ({
  db: mockDb,
  domains: mockDb.domains,
  subjects: mockDb.subjects,
  topics: mockDb.topics,
  subtopics: mockDb.subtopics,
  questions: mockDb.questions,
  skills: mockDb.skills,
  questionSkills: mockDb.questionSkills
}));

describe('HierarchyFactory Batching (T94)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use batch insert for questions and skills', async () => {
        const payload = {
            domainName: 'Domain 1',
            subjects: [{
                name: 'Subject 1',
                topics: [{
                    name: 'Topic 1',
                    subtopics: [{
                        name: 'Subtopic 1',
                        questions: [
                            { questionText: 'Q1', skillNames: ['S1', 'S2'] },
                            { questionText: 'Q2', skillNames: ['S2', 'S3'] }
                        ]
                    }]
                }]
            }]
        };

        // Setup mocks on the shared mockTx
        vi.mocked(mockTx.query.domains.findFirst).mockResolvedValue({ id: 'd1', name: 'Domain 1' } as any);
        vi.mocked(mockTx.query.subjects.findMany).mockResolvedValue([{ id: 's1', name: 'Subject 1' }] as any);
        vi.mocked(mockTx.query.topics.findMany).mockResolvedValue([{ id: 't1', name: 'Topic 1' }] as any);
        vi.mocked(mockTx.query.subtopics.findMany).mockResolvedValue([{ id: 'st1', name: 'Subtopic 1' }] as any);
        vi.mocked(mockTx.query.skills.findMany).mockResolvedValue([{ id: 'sk1', name: 'S1' }] as any);
        
        vi.mocked(mockTx.returning)
            .mockResolvedValueOnce([{ id: 'q1', difficulty: 'simple' }, { id: 'q2', difficulty: 'simple' }] as any) // questions
            .mockResolvedValueOnce([{ id: 'sk2', name: 'S2' }, { id: 'sk3', name: 'S3' }] as any); // missing skills

        const results = await HierarchyFactory.atomicUpsert(payload);

        expect(results.questionIds).toHaveLength(2);
        // Verify batching happen by checking if returning was called (indicating inserts happened)
        expect(mockTx.returning).toHaveBeenCalled();
    });
});
