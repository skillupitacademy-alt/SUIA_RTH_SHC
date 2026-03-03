import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamEngine } from '../exam.engine';
import { cacheService } from '@/modules/core/cache.service';
import { db } from '@quiz/db';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            exams: { findFirst: vi.fn() as any },
            idempotencyKeys: { findFirst: vi.fn() as any }
        },
        transaction: vi.fn().mockImplementation(async (cb) => cb({
            query: {
                exams: { findFirst: vi.fn() as any },
                idempotencyKeys: { findFirst: vi.fn() as any }
            },
            insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'e1', status: 'started', durationSeconds: 3600 }]) }) }),
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) })
        }))
    },
    exams: {}, idempotencyKeys: {}, examQuestions: {}
}));

vi.mock('@/modules/selection-engine/selection.service', () => ({
    SelectionService: {
        composeExam: vi.fn().mockResolvedValue({ questions: [{ id: 'q1', questionText: 'foo', options: {}, type: 'mcq' }], blueprint: { id: 'transient', timeLimit: 60 } })
    }
}));

vi.mock('@/modules/core/cache.service', () => ({
    cacheService: {
        get: vi.fn().mockRejectedValue(new Error('fail')), // Force fallback to DB
        set: vi.fn().mockResolvedValue(true)
    }
}));

describe('ExamEngine extreme tail logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('submitAnswer: throws unauthorized if db exam belongs to different user (Line 208)', async () => {
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ id: 'e1', userId: 'OTHER_USER', status: 'started' } as any);

        await expect(ExamEngine.submitAnswer('e1', 'q1', 'a', 'ACTUAL_USER', 'idem1'))
            .rejects.toThrow('Unauthorized');
    });

    it('submitAnswer: uses durationSeconds defaults when missing (Lines 243, 258)', async () => {
        // Line 243 is checking db exam !== null
        // Line 258 handles missing blueprint and duration
        const oldStart = new Date(Date.now() - 1000).toISOString();
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({
            id: 'e1', userId: 'USER', status: 'started', startedAt: oldStart,
            blueprint: null // Blueprint missing! durationSeconds missing! Default becomes 3600
        } as any);

        // Expect to pass through since we mocked db.transaction successfully now
        await expect(ExamEngine.submitAnswer('e1', 'q1', 'a', 'USER')).resolves.toBeUndefined();
    });

    it('completeExam: handles existing idempotency key and unauthorized logic (Lines 301-309)', async () => {
        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue({ examId: 'e_actual' } as any);
        // Then we find the exam
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ id: 'e_actual', userId: 'OTHER_USER', status: 'started' } as any);

        await expect(ExamEngine.completeExam('e1', 'ACTUAL_USER', 'idem1'))
            .rejects.toThrow('Unauthorized');
    });

    it('startExam: evaluates empty idempotencyKey gracefully (Line 73)', async () => {
        // Line 73 bypasses insertion if idempotencyKey is undefined/null/empty
        
        const res = await (ExamEngine as any).startExam('USER', 'sub1', '');
        expect(res.durationSeconds).toBe(3600);
    });

    it('startExam: constructs response with missing durationSeconds and firstQuestion correctly (Line 122)', async () => {
       // We explicitly override the transaction mock to hit resumeExamSession
       db.transaction = vi.fn().mockImplementation(async (cb: any) => {
            const tx = {
                query: {
                    idempotencyKeys: { findFirst: vi.fn().mockResolvedValue({ examId: 'e2' }) },
                    exams: { findFirst: vi.fn().mockResolvedValue({
                        id: 'e2', startedAt: new Date(),
                        durationSeconds: null, // LINE 122 MISSING DURATION
                        examQuestions: [ { order: 1 } ] // MISSING QUESTION PROPERTY
                    })}
                },
                insert: vi.fn().mockImplementation(() => { throw new Error('SHOULD NOT REACH INSERT'); })
            };
            return await cb(tx);
       });

       const res = await (ExamEngine as any).startExam('USER', 'sub1', 'EXISTING_KEY');
       expect(res.remainingSeconds).toBeNull();
       expect(res.firstQuestion).toBeNull();
    });

    it('handleRaceCondition: executes the full resolution logic on valid idempotency hit (Lines 162-175)', async () => {
        // Here we test handleRaceCondition which gets triggered by PG error handling.
        vi.mocked(db.transaction).mockRejectedValueOnce({ code: '23505', message: 'unq_user_key' } as any);

        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue({ examId: 'e3' } as any);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({
            id: 'e3', startedAt: new Date(), status: 'started',
            durationSeconds: 3600,
            examQuestions: [
               { order: 1, question: { id: 'q1', questionText: 'foo', type: 'mcq' } }
            ]
        } as any);

        const res = await (ExamEngine as any).startExam('USER', 'sub1', 'VALID_KEY');
        expect(res.durationSeconds).toBe(3600);
        expect(res.remainingSeconds).toBeGreaterThan(0);
        expect(res.firstQuestion.id).toBe('q1');
    });
});
