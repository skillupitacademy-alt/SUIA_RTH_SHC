import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamEngine } from '../exam.engine';
import { ExamRepository } from '../repositories/exam.repository';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { cacheService } from '@/modules/core/cache.service';
import { container } from '@/modules/core/container';

vi.mock('@/modules/core/cache.service', () => ({
    cacheService: {
        get: vi.fn(),
        set: vi.fn()
    }
}));

vi.mock('@/modules/system/jobs.service', () => ({
    JobsService: {
        createJob: vi.fn().mockResolvedValue({ id: 'test-job-id' })
    }
}));

vi.mock('@/modules/system/job-orchestrator', () => ({
    JobOrchestrator: {
        runJob: vi.fn().mockResolvedValue(undefined)
    }
}));

describe('ExamEngine extreme tail 3 logic', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
    });

    it('startExam: handles null blueprint timeLimit (Line 60)', async () => {
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(undefined as any);
        vi.spyOn(SelectionService.prototype, 'composeExam').mockResolvedValue({
            questions: [{ id: 'q1', questionText: 'foo', options: {}, type: 'mcq' }] as any,
            blueprint: { id: 'transient', timeLimit: null } as any
        });
        vi.spyOn(ExamRepository.prototype, 'createExamWithQuestions').mockResolvedValue({
            id: 'e1', status: 'started', durationSeconds: null
        } as any);

        const res = await container.get(ExamEngine).startExam('u1', 'sub1', 'NEW_IDEM');
        expect(res.durationSeconds).toBeNull();
    });

    it('handleRaceCondition: returns active exam properties explicitly (Lines 162-175)', async () => {
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'race_exam' } as any);
        vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
            id: 'race_exam',
            status: 'started',
            durationSeconds: null,
            startedAt: new Date(Date.now() - 10000).toISOString(),
            examQuestions: [
               { order: 1 } // missing 'question' deliberately
            ]
        } as any);

        const res = await (container.get(ExamEngine) as any).handleRaceCondition('u1', 'idem1');
        expect(res.examId).toBe('race_exam');
        expect(res.remainingSeconds).toBeNull();
        expect(res.firstQuestion).toBeNull();
    });

    it('getAndCacheActiveExam: covers line 243 explicitly by hitting cache directly', async () => {
        vi.mocked(cacheService.get).mockResolvedValue({ id: 'e_direct_cache' } as any);
        
        const res = await (container.get(ExamEngine) as any).getAndCacheActiveExam('u1', 'e_direct_cache');
        expect(res.id).toBe('e_direct_cache');
    });

    it('completeExam: handles existing idempotency key NOT found (Line 301)', async () => {
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any);
        vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
        vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue({ id: 'e1', userId: 'u1', status: 'started' } as any);
        vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([{ id: 'e1' }] as any);
        vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({ id: 'e1', examQuestions: [] } as any);
        vi.spyOn(ExamRepository.prototype, 'recordIdempotency').mockResolvedValue(undefined as any);

        const res = await container.get(ExamEngine).completeExam('e1', 'u1', 'idem');
        expect(res.examId).toBe('e1');
    });

    it('handleRaceCondition: handles undefined exam gracefully (Line 162)', async () => {
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'race_exam_missing' } as any);
        vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue(undefined as any);

        await expect((container.get(ExamEngine) as any).handleRaceCondition('u1', 'idem1')).rejects.toThrow();
    });

    it('completeExam: throws Exam not found if fullExam is null (Line 308)', async () => {
        vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any);
        vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
        vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue(undefined as any);

        await expect(container.get(ExamEngine).completeExam('e_missing', 'u1', 'idem')).rejects.toThrow('Exam not found');
    });
});
