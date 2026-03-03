import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamEngine } from '../exam.engine';
import { db } from '@quiz/db';
import { cacheService } from '@/modules/core/cache.service';
import { SelectionService } from '@/modules/selection-engine/selection.service';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            exams: { findFirst: vi.fn() },
            idempotencyKeys: { findFirst: vi.fn() },
            examBlueprints: { findFirst: vi.fn() }
        },
        transaction: vi.fn(),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn() }) }) }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn(), onConflictDoNothing: vi.fn() }) })
    },
    exams: {}, idempotencyKeys: {}, examQuestions: {}
}));

vi.mock('@/modules/core/cache.service', () => ({
    cacheService: {
        get: vi.fn(),
        set: vi.fn()
    }
}));

vi.mock('../report-engine/performance.service', () => ({
    PerformanceService: {
        invalidateCache: vi.fn()
    }
}));

vi.mock('@/modules/selection-engine/selection.service', () => ({
    SelectionService: {
        composeExam: vi.fn()
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
    });

    it('startExam: handles null blueprint timeLimit (Line 60)', async () => {
        vi.mocked(SelectionService.composeExam).mockResolvedValue({
            questions: [{ id: 'q1', questionText: 'foo', options: {}, type: 'mcq' }] as any,
            blueprint: { id: 'transient', timeLimit: null } as any
        });
        vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
            const tx = {
                query: { idempotencyKeys: { findFirst: vi.fn().mockResolvedValue(null) } },
                insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'e1', status: 'started', durationSeconds: null }]) }) })
            };
            return await cb(tx);
        });

        const res = await (ExamEngine as any).startExam('USER', 'sub1', 'NEW_IDEM');
        expect(res.durationSeconds).toBeNull();
    });

    it('handleRaceCondition: returns active exam properties explicitly (Lines 162-175)', async () => {
        // Test branch where durationSeconds is null, and firstQuestion is null due to missing question property.
        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue({ examId: 'race_exam' } as any);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({
            id: 'race_exam',
            status: 'started',
            durationSeconds: null,
            startedAt: new Date(Date.now() - 10000).toISOString(),
            examQuestions: [
               { order: 1 } // missing 'question' deliberately
            ]
        } as any);

        const res = await (ExamEngine as any).handleRaceCondition('USER', 'idem1');
        expect(res.examId).toBe('race_exam');
        expect(res.remainingSeconds).toBeNull();
        expect(res.firstQuestion).toBeNull();
    });

    it('getAndCacheActiveExam: covers line 243 explicitly by hitting cache directly', async () => {
        // Test branch where cache GET succeeds, so if(exam === null) is SKIPPED
        vi.mocked(cacheService.get).mockResolvedValue({ id: 'e_direct_cache' } as any);
        
        const res = await (ExamEngine as any).getAndCacheActiveExam('USER', 'e_direct_cache');
        expect(res.id).toBe('e_direct_cache');
        // DB should NOT be queried
        expect(db.query.exams.findFirst).not.toHaveBeenCalled();
    });

    it('completeExam: handles existing idempotency key NOT found (Line 301)', async () => {
        // Line 297: provided idempotencyKey, but Line 301 existingKey is FALSEY
        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue(null as any);
        
        // This means targetExamId remains 'e1' instead of mapped to something else.
        // We configure the mock so it doesn't throw, allowing the branch to finish gracefully.
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ id: 'e1', userId: 'USER', status: 'started' } as any);
        vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'e1' }]) }) }) } as any);

        const res = await ExamEngine.completeExam('e1', 'USER', 'idem');
        expect(res.examId).toBe('e1');
    });

    it('handleRaceCondition: handles undefined exam gracefully (Line 162)', async () => {
        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue({ examId: 'race_exam_missing' } as any);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue(undefined as any);

        await expect((ExamEngine as any).handleRaceCondition('USER', 'idem1')).rejects.toThrow('Collision recovery failed');
    });

    it('completeExam: throws Exam not found if fullExam is null (Line 308)', async () => {
        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue(null as any);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue(null as any);

        await expect(ExamEngine.completeExam('e_missing', 'USER', 'idem')).rejects.toThrow('Exam not found');
    });
});
