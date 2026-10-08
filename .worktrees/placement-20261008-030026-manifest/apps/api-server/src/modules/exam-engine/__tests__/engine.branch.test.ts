import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, exams, idempotencyKeys, examQuestions } from '@quiz/db';
import { ExamEngine } from '../exam.engine';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { cacheService } from '@/modules/core/cache.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { container } from '@/modules/core/container';

vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));
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
                examBlueprints: { findFirst: vi.fn() }
            },
            insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'exam-id' }]), onConflictDoNothing: vi.fn().mockResolvedValue(undefined), catch: vi.fn() }),
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'exam-id' }]), catch: vi.fn() }),
            select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
            innerJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            then: (resolve: (value: unknown) => void) => resolve([{ id: 'exam-id', userId: 'u1', status: 'started' }])
        })
        })),
        query: {
            exams: { findFirst: vi.fn() },
            idempotencyKeys: { findFirst: vi.fn() },
            examBlueprints: { findFirst: vi.fn() }
        },
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            innerJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            then: (resolve: (value: unknown) => void) => resolve([{ id: 'exam-id', userId: 'u1', status: 'started' }])
        }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'exam-id' }]), catch: vi.fn() })
    },
    exams: { id: 'id', status: 'status', userId: 'userId', startedAt: '2024-01-01' },
    idempotencyKeys: { examId: 'eid', userId: 'uid', key: 'k' },
    examQuestions: { id: 'id', examId: 'eid' },
    questions: { id: 'qid' },
    questionSkills: { questionId: 'qid', skillId: 'sid' },
    examBlueprints: { id: 'bid' },
    subjects: { id: 'sid' },
    topics: { id: 'tid' },
    subtopics: { id: 'stid' },
    skills: { id: 'skid' },
    eq: vi.fn()
}));

describe('Engines & Selection branch coverage', () => {
    const makeSelect = (rows: any[] = []) => ({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve(rows),
    });

    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
    });

    it('ExamEngine.handleRaceCondition recovery (Lines 145-187)', async () => {
        // Mock idempotency key found during race condition
        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue({ examId: 'e1' } as any);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ 
            id: 'e1', status: 'started', startedAt: new Date().toISOString(), durationSeconds: 60,
            examQuestions: [{ question: { id: 'q1', type: 'mcq' }, order: 1 }]
        } as any);
        const { ExamRepository } = await import('../repositories/exam.repository');
        const repoSpy = vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
            id: 'e1',
            status: 'started',
            userId: 'u1',
            startedAt: new Date(),
            durationSeconds: 60,
            examQuestions: [{ order: 1, question: { id: 'q1', questionText: 'Q1', options: [], codeSnippet: null, type: 'mcq' } }]
        } as any);

        const result = await (container.get(ExamEngine) as any).handleRaceCondition('u1', 'idem1');
        expect(result.examId).toBe('e1');
        repoSpy.mockRestore();
    });

    it('ExamEngine.getAndCacheActiveExam session not found (Line 248)', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue(undefined);
        vi.mocked(db.select).mockReturnValueOnce(makeSelect([]));
        await expect((container.get(ExamEngine) as any).getAndCacheActiveExam('u1', 'e-missing')).rejects.toThrow('Session not found');
    });

    it('ExamEngine.completeExam idempotency resume (Lines 301-309)', async () => {
        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue({ examId: 'e-existing' } as any);
        // Mock findById - called via ExamRepository which uses db.select().from().where()
        const { ExamRepository } = await import('../repositories/exam.repository');
        const idemSpy = vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'e-existing' } as any);
        const repoSpy = vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
            id: 'e-existing',
            status: 'completed',
            userId: 'u1',
            startedAt: new Date(),
            durationSeconds: 60,
            examQuestions: [{ order: 1, question: { id: 'q1', questionText: 'Q1', options: [], codeSnippet: null, type: 'mcq' } }]
        } as any);

        vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);

        const engine = container.get(ExamEngine);
        const result = await engine.completeExam('new-e', 'u1', 'submit-idem');
        expect(result.examId).toBe('e-existing');
        repoSpy.mockRestore();
        idemSpy.mockRestore();
    });

    it('ScoringEngine.calculateExamResults exam not found (Line 45)', async () => {
        vi.mocked(db.select).mockReturnValueOnce(makeSelect([]));
        vi.mocked(db.query.exams.findFirst).mockResolvedValue(undefined);
        await expect(ScoringEngine.calculateExamResults('e-missing')).rejects.toThrow('Exam not found');
    });

    it('SelectionService.resolveBlueprint cache failure (Line 96/119)', async () => {
        vi.mocked(cacheService.get).mockRejectedValueOnce(new Error('Cache Read Fail'));
        vi.mocked(cacheService.set).mockRejectedValueOnce(new Error('Cache Write Fail'));
        // Mock the DB lookup that happens after cache fail
        (db.query.examBlueprints as any) = { findFirst: vi.fn().mockResolvedValue({ id: 'b1' }) };
        
        await (container.get(SelectionService) as any).resolveBlueprint('u1', 'b1');
        expect(cacheService.get).toHaveBeenCalled();
    });
});


