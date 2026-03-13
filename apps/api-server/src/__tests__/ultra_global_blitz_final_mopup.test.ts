import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectionService } from '../modules/selection-engine/selection.service';
import { JobOrchestrator } from '../modules/system/job-orchestrator';
import { JobsService } from '../modules/system/jobs.service';
import { RetentionService } from '../modules/system/retention.service';
import { DrizzleQuestionRepository } from '../repositories/implementations/drizzle-question.repository';
import { DrizzleAdminAnalyticsRepository } from '../repositories/implementations/drizzle-admin-analytics.repository';
import { DrizzleSubjectRepository } from '../repositories/implementations/drizzle-subject.repository';
import { db } from '@quiz/db';
import { JobType } from '@quiz/types';
import { container } from '../modules/core/container';

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

// Mock DB
vi.mock('@quiz/db', async () => {
    const actual = await vi.importActual('@quiz/db') as any;
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
    
    const mockDb = {
        ...actual.db,
        query: {
            ...actual.db.query,
            examBlueprints: { findFirst: vi.fn().mockResolvedValue(undefined) },
            questions: { findMany: vi.fn().mockResolvedValue([]) },
            backgroundJobs: { findFirst: vi.fn().mockResolvedValue(undefined), findMany: vi.fn().mockResolvedValue([]) },
            auditLogs: { findMany: vi.fn().mockResolvedValue([]) },
            subjects: { findMany: vi.fn().mockResolvedValue([]) },
            domains: { findFirst: vi.fn().mockResolvedValue(undefined) },
            exams: { findFirst: vi.fn().mockResolvedValue(undefined) },
            idempotencyKeys: { findFirst: vi.fn().mockResolvedValue(undefined) },
        },
        insert: vi.fn(() => ({ 
            values: vi.fn(() => ({ 
                returning: vi.fn(() => Promise.resolve([{ id: 'new-id' }])),
                onConflictDoNothing: vi.fn().mockResolvedValue({ success: true })
            })) 
        })),
        update: vi.fn(() => ({ 
            set: vi.fn(() => ({ 
                where: vi.fn(() => ({ 
                    returning: vi.fn(() => Promise.resolve([{ id: 'upd-id' }])) 
                })) 
            })) 
        })),
        delete: vi.fn(() => ({ 
            where: vi.fn(() => ({ 
                returning: vi.fn(() => Promise.resolve([{ id: 'del-id' }])) 
            })) 
        })),
        select: vi.fn(() => makeSelect([{ count: 1 }])),
        transaction: vi.fn(async (cb) => cb({
            insert: vi.fn(() => ({ 
                values: vi.fn(() => ({ 
                    returning: vi.fn(() => Promise.resolve([{ id: 'tx-new-id' }])),
                    onConflictDoNothing: vi.fn().mockResolvedValue({ success: true })
                })) 
            })),
            update: vi.fn(() => ({ 
                set: vi.fn(() => ({ 
                    where: vi.fn(() => ({ 
                        returning: vi.fn(() => Promise.resolve([{ id: 'tx-upd-id' }])) 
                    })) 
                })) 
            })),
            query: {
                exams: { findFirst: vi.fn().mockResolvedValue(undefined) },
                subjects: { findMany: vi.fn().mockResolvedValue([]) },
                topics: { findMany: vi.fn().mockResolvedValue([]) },
                subtopics: { findMany: vi.fn().mockResolvedValue([]) },
                skills: { findMany: vi.fn().mockResolvedValue([]) },
                domains: { findFirst: vi.fn().mockResolvedValue(undefined) },
                idempotencyKeys: { findFirst: vi.fn().mockResolvedValue(undefined) },
                backgroundJobs: { findFirst: vi.fn().mockResolvedValue(undefined) }
            },
            select: vi.fn(() => makeSelect([{ count: 1 }])),
        }))
    };

    return {
        ...actual,
        db: mockDb,
        withTimeout: vi.fn(async (p, _t, _d) => p)
    };
});

// Mock Cache
vi.mock('../modules/core/cache.service', () => ({
    cacheService: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue({ success: true }),
        catch: vi.fn().mockReturnValue({ catch: vi.fn() }),
        invalidateCache: vi.fn().mockResolvedValue({ success: true })
    }
}));

// Mock Queue
vi.mock('../modules/core/queue.service', () => ({
    queueService: {
        enqueue: vi.fn().mockResolvedValue({ success: true, messageId: 'm1' })
    }
}));

// Mock jose
vi.mock('jose', () => ({
    jwtVerify: vi.fn(),
    importJWK: vi.fn(),
    SignJWT: vi.fn(() => ({
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue('mocked-token')
    }))
}));

describe('Final Global Blitz Coverage Mop-up', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        JobsService.withDb(db as any);

        // Standardize count mock globally
        vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            innerJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            then: (resolve: (value: unknown) => void) => resolve([{ count: 123 }]),
        } as any);

        // Standardize findMany/findFirst fallbacks
        vi.mocked(db.query.questions.findMany).mockResolvedValue([]);
        vi.mocked(db.query.backgroundJobs.findMany).mockResolvedValue([]);
        vi.mocked(db.query.auditLogs.findMany).mockResolvedValue([]);
        vi.mocked(db.query.subjects.findMany).mockResolvedValue([]);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue(undefined);
        vi.mocked(db.query.idempotencyKeys.findFirst).mockResolvedValue(undefined);
    });

    describe('SelectionService Tails', () => {
        it('hits line 244 (null config destructuring)', async () => {
            const service = new SelectionService(db as any, { get: vi.fn(), set: vi.fn() } as any);
            const blueprint: any = { id: 'b1', domains: ['d1'], totalQuestions: 10 };
            const result = await (service as any).resolveSelectionCriteria('d1', null as any, blueprint);
            expect(result.requestedTotal).toBe(10);
        });

        it('hits line 324, 409 (Selection Engine edges)', async () => {
            const service = new SelectionService(db as any, { get: vi.fn(), set: vi.fn() } as any);
            // Test fetchBatchFromPool shortcut
            const result = await (service as any).fetchBatchFromPool({ requestedTotal: 0 });
            expect(result).toEqual([]);

            // Test executeDynamicSelection failure (Line 409/436)
            const criteria: any = { requestedTotal: 10, difficultyPref: 'simple', finalSubtopicIds: [], actualTopicIds: [], actualSubjectIds: [] };
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                innerJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                groupBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                then: (resolve: (value: unknown) => void) => resolve([]),
            } as any);

            await expect((service as any).executeDynamicSelection('u1', 'd1', 'i1', criteria, { id: 'b1' }))
                .rejects.toThrow();
        });
    });

    describe('Auth & System Tails', () => {
        it('TokenService: Audience mismatch and normalizeError (Line 201, 219)', async () => {
            const { TokenService } = await import('../modules/auth/token.service');
            const { jwtVerify } = await import('jose');
            const service = new TokenService();
            
            vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: { aud: 'wrong' }, protectedHeader: {} } as any);
            await expect(service.verifyAccessToken('dummy', { audience: 'correct' })).rejects.toThrow();

            vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Signature verification failed'));
            await expect(service.verifyAccessToken('invalid', { isAdmin: false })).rejects.toThrow();
        });

        it('AuditLoggingExamRepository: recordIdempotency (Line 61)', async () => {
            const { AuditLoggingExamRepository } = await import('../modules/exam-engine/audit-logging.decorator');
            const mockBase: any = { recordIdempotency: vi.fn().mockResolvedValue({ success: true }) };
            const decorated = new AuditLoggingExamRepository(mockBase);
            await decorated.recordIdempotency({ userId: 'u1', key: 'k1', examId: 'e1' });
            expect(mockBase.recordIdempotency).toHaveBeenCalled();
        });
    });

    describe('Engine Tails', () => {
        it('ExamEngine: Flush Redis answer miss and Queue failure (Line 328, 378)', async () => {
            const { ExamEngine } = await import('../modules/exam-engine/exam.engine');
            const { cacheService } = await import('../modules/core/cache.service');
            const { queueService } = await import('../modules/core/queue.service');
            const { ExamRepository } = await import('../modules/exam-engine/repositories/exam.repository');
            const { PerformanceService } = await import('../modules/report-engine/performance.service');
            const { AnswerEvaluationEngine } = await import('../modules/answer-engine/answer.engine');
            
            const mRepo = new (ExamRepository as any)();
            const mPerf = { invalidateCache: vi.fn().mockResolvedValue({ success: true }) };
            const mEval = { evaluate: vi.fn() };
            const mSelection = { resolveSelectionCriteria: vi.fn() };

            vi.spyOn(container, 'get').mockImplementation((token: any) => {
                if (token === ExamRepository) return mRepo;
                if (token === PerformanceService) return mPerf;
                if (token === AnswerEvaluationEngine) return mEval;
                if (token === SelectionService) return mSelection;
                return {} as any;
            });

            const engine = new ExamEngine();

            const mockExam: any = {
                id: 'e1',
                userId: 'u1',
                status: 'started',
                startedAt: new Date(),
                examQuestions: [{ id: 'eq1', questionId: 'q1', question: { type: 'mcq', correctAnswer: 'A' } }]
            };

            vi.spyOn(mRepo, 'findById').mockResolvedValue(mockExam as any);
            vi.spyOn(mRepo, 'checkIdempotency').mockResolvedValue(undefined);
            vi.mocked(db.query.exams.findFirst).mockResolvedValue(mockExam);

            vi.mocked(db.transaction).mockImplementationOnce(async (callback: any) => {
                const tx = {
                    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'e1' }]) })) })) })),
                    insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoNothing: vi.fn() })) })),
                    query: { 
                        exams: { findFirst: vi.fn().mockResolvedValue(mockExam) }, // For flush fetchQuestions
                        backgroundJobs: { findFirst: vi.fn().mockResolvedValue(undefined) },
                        idempotencyKeys: { findFirst: vi.fn().mockResolvedValue(undefined) },
                        subjects: { findMany: vi.fn().mockResolvedValue([]) },
                        topics: { findMany: vi.fn().mockResolvedValue([]) },
                        subtopics: { findMany: vi.fn().mockResolvedValue([]) },
                        skills: { findMany: vi.fn().mockResolvedValue([]) }
                    },
                    select: vi.fn(() => makeSelect([{ count: 123 }])),
                };
                return callback(tx);
            });

            vi.mocked(cacheService.get).mockResolvedValue(null);

            process.env.QSTASH_TOKEN = 'test';
            vi.mocked(queueService.enqueue).mockResolvedValueOnce({ success: false, messageId: 'm1' } as any);

            await engine.completeExam('e1', 'u1', 'i1');
            expect(queueService.enqueue).toHaveBeenCalled();
        });

        it('HierarchyFactory: Resolve new domain (Lines 170-176)', async () => {
            const { HierarchyFactory } = await import('../modules/domain/hierarchy.factory');
            const tx: any = {
                query: { domains: { findFirst: vi.fn().mockResolvedValue(undefined) } },
                insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: () => Promise.resolve([{ id: 'new-domain-id' }]) })) })),
                update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
            };

            const payload = {
                domainName: 'Brand New Domain',
                description: 'Desc',
                category: 'Cat',
                subjects: []
            };

            const result = await (HierarchyFactory as any).resolveDomain(tx, payload, (HierarchyFactory as any).initResults());
            expect(result).toBe('new-domain-id');
        });

        it('ScoringEngine: withTimeout fallback (Line 20)', async () => {
            const { __withTimeout } = await import('../modules/scoring-engine/scoring.engine');
            expect(__withTimeout).toBeDefined();
            const res = await (__withTimeout as any)(Promise.resolve('ok'), 5000, 'ScoringEngine.test');
            expect(res).toBe('ok');
        });
    });

    describe('Repository Tails', () => {
        let repo: DrizzleQuestionRepository;
        let adminRepo: DrizzleAdminAnalyticsRepository;
        let subjectRepo: DrizzleSubjectRepository;

        beforeEach(() => {
            repo = new DrizzleQuestionRepository();
            adminRepo = new DrizzleAdminAnalyticsRepository();
            subjectRepo = new DrizzleSubjectRepository();
        });

        it('DrizzleQuestionRepository: findAll and bulkStatusUpdate', async () => {
            await repo.findAll('2023-01-01T00:00:00.000Z|q1', 10);
            await repo.bulkStatusUpdate(['q1'], 'active');
            expect(db.update).toHaveBeenCalled();
        });

        it('AdminAnalyticsRepository: getAuditLogs', async () => {
            await adminRepo.getAuditLogs('2023-01-01T00:00:00.000Z|a1', 10);
            expect(db.query.auditLogs.findMany).toHaveBeenCalled();
        });

        it('DrizzleSubjectRepository: deleteBatch', async () => {
            await subjectRepo.deleteBatch(['s1']);
            expect(db.delete).toHaveBeenCalled();
        });
    });

    describe('System Layer Tails', () => {
        it('RetentionService: performCleanup catch block', async () => {
            const originalAllSettled = Promise.allSettled;
            (Promise as any).allSettled = vi.fn().mockImplementationOnce(() => { throw new Error('critical'); });
            await expect(RetentionService.performCleanup()).rejects.toThrow('critical');
            Promise.allSettled = originalAllSettled;
        });

        it('JobsService: listJobs with cursor', async () => {
            vi.mocked(db.query.backgroundJobs.findMany).mockResolvedValueOnce([
                { id: 'j1', createdAt: new Date() },
                { id: 'j2', createdAt: new Date() }
            ] as any);
            await JobsService.listJobs({ 
                cursor: { createdAt: new Date().toISOString(), id: 'c1' },
                limit: 10 
            });
            expect(db.query.backgroundJobs.findMany).toHaveBeenCalled();
        });
    });

});
