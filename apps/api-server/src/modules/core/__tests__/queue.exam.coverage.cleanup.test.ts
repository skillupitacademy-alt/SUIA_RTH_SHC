import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueService } from '../queue.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { db, exams, idempotencyKeys, examQuestions, backgroundJobs, notifications } from '@quiz/db';
import { cacheService } from '@/modules/core/cache.service';
import { ExamBuilder } from '@/modules/exam-engine/exam.builder';

const { makeSelect } = vi.hoisted(() => ({
    makeSelect: (rows: any[] = []) => ({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve(rows),
    })
}));

vi.mock('@/modules/core/cache.service');
vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        transaction: vi.fn(async (fn) => fn({ 
            query: {
                exams: { findFirst: vi.fn() },
                idempotencyKeys: { findFirst: vi.fn() },
                backgroundJobs: { findFirst: vi.fn() }
            },
            select: vi.fn().mockReturnValue(makeSelect([])),
            insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'exam-id' }]) }) }),
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'exam-id' }]) }) }) })
        })),
        query: {
            idempotencyKeys: { findFirst: vi.fn() },
            exams: { findFirst: vi.fn() },
            backgroundJobs: { findFirst: vi.fn() },
            notifications: { findFirst: vi.fn() }
        },
        select: vi.fn().mockReturnValue(makeSelect([])),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'ins-id' }]) }) }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'upd-id' }])
                })
            })
        })
    },
    idempotencyKeys: { id: 'id', userId: 'userId', key: 'key' },
    exams: { id: 'id', status: 'status' },
    examQuestions: { examId: 'eid', questionId: 'qid', order: 'o' },
    backgroundJobs: { id: 'id', userId: 'userId', type: 'type' },
    notifications: { id: 'id', userId: 'userId' },
    questions: { id: 'qid' },
    skills: { id: 'sid' }
}));

describe('Queue and Exam cleanup coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('QueueService.enqueue returns success:false when token is missing (Line 43-45)', async () => {
        (queueService as any).qstashToken = null;
        const result = await queueService.enqueue('job', {});
        expect(result.success).toBe(false);
    });

    it('ExamEngine.startExam hits idempotency mapping (Line 39, 73)', async () => {
        vi.spyOn(ExamBuilder.prototype, 'build').mockResolvedValue({
            exam: { id: 'exam-id', status: 'started', durationSeconds: 3600 },
            questions: [{ id: 'q1', questionText: 'Q1', options: [], codeSnippet: null, type: 'mcq' }]
        } as any);

        const result = await ExamEngine.startExam('u1', 'b1', 'idem-123');
        expect(result.examId).toBe('exam-id');
    });

    it('ExamEngine.completeExam catch block for flush (Line 343-345)', async () => {
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({
            id: 'e1', status: 'started', userId: 'u1',
            examQuestions: [{ questionId: 'q1', question: { type: 'mcq', topicId: 't1' } }]
        } as any);

        vi.mocked(db.select)
            .mockReturnValueOnce(makeSelect([{ id: 'e1', userId: 'u1', status: 'started' }]) as any)
            .mockReturnValueOnce(makeSelect([]) as any);
        
        // Force cacheService.get to throw to enter flush catch
        vi.mocked(cacheService.get).mockRejectedValue(new Error('Flush fail'));

        const result = await ExamEngine.completeExam('e1', 'u1');
        expect(result.status).toBe('processing');
    });
});


