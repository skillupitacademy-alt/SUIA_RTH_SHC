import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamEngine } from '../exam.engine';
import { ExamRepository } from '../repositories/exam.repository';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { cacheService } from '@/modules/core/cache.service';
import { container } from '@/modules/core/container';
import { db } from '@quiz/db';

vi.mock('@/modules/core/cache.service', () => ({
    cacheService: {
        get: vi.fn().mockRejectedValue(new Error('fail')), // Force fallback to DB
        set: vi.fn().mockResolvedValue(true)
    }
}));

describe('ExamEngine extreme tail logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
    });

    it('submitAnswer: throws unauthorized if db exam belongs to different user (Line 208)', async () => {
        vi.spyOn(ExamEngine.prototype as any, 'getAndCacheActiveExam').mockResolvedValue(
            { id: 'e1', userId: 'OTHER_USER', status: 'started' } as any
        );

        await expect(container.get(ExamEngine).submitAnswer('e1', 'q1', 'a', 'ACTUAL_USER', 'idem1'))
            .rejects.toThrow('Unauthorized');
    });

    it('submitAnswer: uses durationSeconds defaults when missing (Lines 243, 258)', async () => {
        const oldStart = new Date(Date.now() - 1000).toISOString();
        vi.spyOn(ExamEngine.prototype as any, 'getAndCacheActiveExam').mockResolvedValue({
            id: 'e1', userId: 'u1', status: 'started', startedAt: oldStart,
            blueprint: null
        });
        vi.spyOn(ExamEngine.prototype as any, 'checkExamTimeLimit').mockReturnValue(undefined);
        vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);

        await expect(container.get(ExamEngine).submitAnswer('e1', 'q1', 'a', 'u1')).resolves.toBeUndefined();
    });

    it('completeExam: handles existing idempotency key and unauthorized logic (Lines 301-309)', async () => {
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'e_actual' } as any);
        vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue({ id: 'e_actual', userId: 'OTHER_USER', status: 'started' } as any);
        const { PerformanceService } = await import('@/modules/report-engine/performance.service');
        vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);

        await expect(container.get(ExamEngine).completeExam('e1', 'ACTUAL_USER', 'idem1'))
            .rejects.toThrow('Unauthorized');
    });

    it('startExam: evaluates empty idempotencyKey gracefully (Line 73)', async () => {
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(undefined as any);
        vi.spyOn(SelectionService.prototype, 'composeExam').mockResolvedValue({
            questions: [{ id: 'q1', questionText: 'foo', options: {}, type: 'mcq' }] as any,
            blueprint: { id: 'transient', timeLimit: 60 } as any
        });
        vi.spyOn(ExamRepository.prototype, 'createExamWithQuestions').mockResolvedValue({
            id: 'e1', status: 'started', durationSeconds: 3600
        } as any);

        const res = await container.get(ExamEngine).startExam('u1', 'sub1', '');
        expect(res.durationSeconds).toBe(3600);
    });

    it('startExam: constructs response with missing durationSeconds and firstQuestion correctly (Line 122)', async () => {
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'e2' } as any);
        vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
            id: 'e2', startedAt: new Date(),
            durationSeconds: null,
            examQuestions: [ { order: 1 } ] // MISSING QUESTION PROPERTY
        } as any);

        const res = await container.get(ExamEngine).startExam('u1', 'sub1', 'EXISTING_KEY');
        expect(res.remainingSeconds).toBeNull();
        expect(res.firstQuestion).toBeNull();
    });

    it('handleRaceCondition: executes the full resolution logic on valid idempotency hit (Lines 162-175)', async () => {
        // Create dupErr that triggers handleRaceCondition
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency')
            .mockResolvedValueOnce(undefined as any) // first call in startExam
            .mockResolvedValueOnce({ examId: 'e3' } as any); // second call in handleRaceCondition
        vi.spyOn(SelectionService.prototype, 'composeExam').mockResolvedValue({
            questions: [{ id: 'q1', questionText: 'foo', options: {}, type: 'mcq' }] as any,
            blueprint: { id: 'b1', timeLimit: 60 } as any
        });
        vi.spyOn(ExamRepository.prototype, 'createExamWithQuestions').mockRejectedValue({ code: '23505', message: 'unq_user_key' });
        vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
            id: 'e3', startedAt: new Date(), status: 'started',
            durationSeconds: 3600,
            examQuestions: [
               { order: 1, question: { id: 'q1', questionText: 'foo', type: 'mcq' } }
            ]
        } as any);

        const res = await container.get(ExamEngine).startExam('u1', 'sub1', 'VALID_KEY');
        expect(res.durationSeconds).toBe(3600);
        expect(res.remainingSeconds).toBeGreaterThan(0);
        expect(res.firstQuestion!.id).toBe('q1');
    });
});
