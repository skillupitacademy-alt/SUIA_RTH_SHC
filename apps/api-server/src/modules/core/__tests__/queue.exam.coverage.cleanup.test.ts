import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueService } from '../queue.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { db, exams, idempotencyKeys, examQuestions, backgroundJobs, notifications } from '@quiz/db';
import { cacheService } from '@/modules/core/cache.service';
import { ExamBuilder } from '@/modules/exam-engine/exam.builder';

vi.mock('@/modules/core/cache.service');
vi.mock('@quiz/db', () => ({
    db: {
        transaction: vi.fn(async (fn) => fn({ 
            query: {
                exams: { findFirst: vi.fn() },
                idempotencyKeys: { findFirst: vi.fn() },
                backgroundJobs: { findFirst: vi.fn() }
            }, 
            insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'exam-id' }]) }) }),
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
        })),
        query: {
            idempotencyKeys: { findFirst: vi.fn() },
            exams: { findFirst: vi.fn() },
            backgroundJobs: { findFirst: vi.fn() },
            notifications: { findFirst: vi.fn() }
        },
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
    notifications: { id: 'id', userId: 'userId' }
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
        
        // Force cacheService.get to throw to enter flush catch
        vi.mocked(cacheService.get).mockRejectedValue(new Error('Flush fail'));

        const result = await ExamEngine.completeExam('e1', 'u1');
        expect(result.status).toBe('processing');
    });
});
