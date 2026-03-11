import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockDb } from '../../__test-utils__/mock-db';
import { ExamEngine } from '../exam-engine/exam.engine';
import { ScoringEngine } from '../scoring-engine/scoring.engine';
import { SelectionService } from '../selection-engine/selection.service';
import { AdaptiveBlueprintService } from '../adaptive-engine/adaptive-blueprint.service';
import { AdaptiveTutorService } from '../adaptive-engine/adaptive-tutor.service';
import { TEST_TOPIC, TEST_USER } from '../../__test-utils__/test-fixtures';

// Mock DB & Redis
vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: mockDb,
  exams: { id: 'exams.id', status: 'exams.status', createdAt: 'exams.createdAt' },
  examQuestions: { id: 'examQuestions.id', order: 'examQuestions.order', questionId: 'examQuestions.questionId', examId: 'examQuestions.examId' },
  questions: { id: 'questions.id', topicId: 'questions.topicId', difficulty: 'questions.difficulty' },
  topics: { id: 'topics.id', name: 'topics.name' },
  users: { id: 'users.id', email: 'users.email' },
  idempotencyKeys: { userId: 'idempotencyKeys.userId', key: 'idempotencyKeys.key' },
  examBlueprints: { id: 'examBlueprints.id' },
  subjects: { id: 'subjects.id' },
  subtopics: { id: 'subtopics.id' },
}));


describe('Consolidated Core Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ExamEngine & Scoring', () => {
    it('handles resolution failure and session resume', async () => {
        vi.mocked(mockDb.query.exams.findFirst).mockResolvedValueOnce(undefined);
        await expect((ExamEngine as any).resumeExamSession(mockDb, 'invalid')).rejects.toThrow();

        const mockExam = { id: 'e1', status: 'started', examQuestions: [] };
        vi.mocked(mockDb.query.exams.findFirst).mockResolvedValueOnce(mockExam as any);
        const result = await (ExamEngine as any).resumeExamSession(mockDb, 'e1');
        expect(result.id).toBe('e1');
    });

    it('covers scoring calculations and results', async () => {
        vi.mocked(mockDb.query.exams.findFirst).mockResolvedValue({
            id: 'e1',
            examQuestions: [
                { question: { id: 'q1', difficulty: 'simple', questionSkills: [] } }
            ]
        } as any);

        const results = await ScoringEngine.calculateExamResults('e1');
        expect(results).toBeDefined();
    });
  });

  describe('Selection & Adaptive Logic', () => {
    it('exercises exam composition and criteria resolution', async () => {
        vi.mocked(mockDb.query.examBlueprints.findFirst).mockResolvedValue({ id: 'b1' } as any);
        
        await SelectionService.composeExam('u1', 'b1', 'key1');
        expect(mockDb.query.examBlueprints.findFirst).toHaveBeenCalled();
    });

    it('exercises Blueprint normalization and Tutor master notes', async () => {
        // Blueprint Normalization
        const accuracy = { simple: 80, intermediate: 65, expert: 10 };
        const dist = (AdaptiveBlueprintService as any).calculateDifficultyDistribution(accuracy);
        expect(dist.simple + dist.intermediate + dist.expert).toBe(100);

        // Master Notes (L127)
        vi.mocked(mockDb.query.topics.findFirst).mockResolvedValue(TEST_TOPIC as any);
        vi.mocked(mockDb.query.users.findFirst).mockResolvedValue(TEST_USER as any);
        await AdaptiveTutorService.requestMasterNotes(TEST_USER.id, TEST_TOPIC.id);
        expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});


