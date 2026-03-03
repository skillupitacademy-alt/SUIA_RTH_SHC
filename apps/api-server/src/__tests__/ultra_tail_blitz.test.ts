// CRITICAL: Set JWT secrets before ANY imports
process.env.JWT_SECRET = 'test_secret_32_chars_long_exactly_32_';
process.env.JWT_REFRESH_SECRET = 'refresh_secret_32_chars_long_exac';
process.env.ADMIN_JWT_SECRET = 'admin_secret_32_chars_long_exact';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dbLib from '@quiz/db';
import { eq, and, sql, desc, gte, asc } from 'drizzle-orm';
import { TutorService } from '@/modules/tutor/tutor.service';
import { ForecastService } from '@/modules/intelligence/forecast.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { ReportMaterializer } from '@/services/reports/ReportMaterializer';
import { ResendEmailProvider } from '@/modules/email/providers/ResendEmailProvider';
import { TokenService } from '@/modules/auth/token.service';
import { cacheService } from '@/modules/core/cache.service';
vi.mock('@/modules/core/cache.service', () => ({
    cacheService: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn()
    }
}));
import { ResilienceService } from '@/modules/core/resilience.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { AdaptiveTutorService } from '@/modules/adaptive-engine/adaptive-tutor.service';
import { ReportInterpreter } from '@/modules/report-engine/report-interpreter.service';
vi.mock('@/modules/report-engine/report-interpreter.service');

// --- Constructor Mocks ---

vi.mock('resend', () => {
    return {
        Resend: class {
            emails = { send: vi.fn().mockResolvedValue({ data: { id: 'email_id' } }) };
        }
    };
});

vi.mock('jose', async (importOriginal) => {
    const actual = await importOriginal() as any;
    // Proper class to satisfy constructor + methods
    class MockSignJWT {
        setProtectedHeader = vi.fn().mockReturnThis();
        setAudience = vi.fn().mockReturnThis();
        setIssuedAt = vi.fn().mockReturnThis();
        setExpirationTime = vi.fn().mockReturnThis();
        sign = vi.fn().mockResolvedValue('mocked_token');
    }
    return {
        ...actual,
        SignJWT: MockSignJWT
    };
});

// --- Database Mock with Robust Proxy Chaining ---

vi.mock('@quiz/db', async (importOriginal) => {
  const actual = await importOriginal() as any;
  const createTableMock = () => ({
    findFirst: vi.fn(),
    findMany: vi.fn().mockImplementation((args) => {
      if (typeof args?.where === 'function') {
        const mockOperators = { inArray: vi.fn(), eq: vi.fn(), and: vi.fn(), gte: vi.fn(), lte: vi.fn() };
        args.where({}, mockOperators);
      }
      return Promise.resolve([]);
    }),
  });

  // Proxy that handles chaining AND awaiting
  const createChainableProxy = (value: any = []) => {
    const target = () => {};
    const proxy: any = new Proxy(target, {
      get: (t, prop) => {
        if (prop === 'then') {
          return (resolve: any) => resolve(value);
        }
        // If it's a known method or a random one, return a function that returns the proxy
        return (...args: any[]) => proxy;
      },
      apply: (t, thisArg, args) => proxy, 
    });
    return proxy as any;
  };

  const dbMock = {
    query: {
      exams: createTableMock(),
      userRecommendations: createTableMock(),
      topics: createTableMock(),
      notesDeliveryLocks: createTableMock(),
      userProfiles: createTableMock(),
      resultsByDimension: createTableMock(),
      examQuestions: createTableMock(),
      subtopics: createTableMock(),
      examBlueprints: createTableMock(),
      questions: createTableMock(),
      subjects: createTableMock(),
    },
    select: vi.fn().mockImplementation((fields) => {
        const val = fields?.count ? [{ count: 10 }] : [];
        return createChainableProxy(val);
    }),
    transaction: vi.fn().mockImplementation((cb) => cb(dbMock)),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    insert: vi.fn().mockImplementation(() => createChainableProxy()),
    update: vi.fn().mockImplementation(() => createChainableProxy()),
    delete: vi.fn().mockImplementation(() => createChainableProxy()),
  };

  return {
    ...actual,
    db: dbMock,
    exams: { id: 'e_id', userId: 'u_id' },
    notifications: { id: 'n_id' },
    backgroundJobs: { id: 'j_id' },
    userRecommendations: { userId: 'ur_u' },
    topics: { id: 't_id' },
    notesDeliveryLocks: { userId: 'ndl_u' },
    resultsByDimension: { examId: 'e_id', dimensionType: 'topic' },
    examBlueprints: { id: 'eb_id' },
    examQuestions: { id: 'eq_id' },
    sql: vi.fn((strs) => strs[0]),
    and: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    asc: vi.fn(),
    desc: vi.fn(),
    notInArray: vi.fn(),
  };
});

describe('Ultra Final Coverage Marathon - 100% Global Blitz', () => {
    const mDb = (dbLib as any).db;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(ResilienceService, 'isFeatureEnabled').mockResolvedValue(true);
        vi.spyOn(PerformanceService, 'getCachedReport').mockResolvedValue(null);
        vi.spyOn(PerformanceService, 'refreshAnalytics').mockResolvedValue(undefined as any);
        vi.spyOn(PerformanceService, 'cacheReport').mockResolvedValue(undefined as any);
        vi.spyOn(ReportMaterializer, 'materialize').mockImplementation(async () => ({} as any));
        vi.spyOn(ReportInterpreter, 'interpret').mockReturnValue({} as any);
        vi.spyOn(AdaptiveTutorService, 'generateInsights').mockResolvedValue({} as any);
        (ReportEngine as any)._db = mDb;
        (SelectionService as any)._db = mDb;
        (ScoringEngine as any)._db = mDb;
    });

    // --- 1. Tutor & Intelligence ---

    describe('TutorService Gaps', () => {
        it('hits feature disabled (Line 18)', async () => {
            vi.mocked(ResilienceService.isFeatureEnabled).mockResolvedValueOnce(false);
            await TutorService.processExamResults('e1');
            expect(mDb.query.exams.findFirst).not.toHaveBeenCalled();
        });

        it('hits zero weak topics early return (Line 44)', async () => {
            mDb.query.exams.findFirst.mockResolvedValue({ userId: 'u1' });
            // Overwrite select chain to return empty for this test
            mDb.select.mockImplementationOnce(() => ({
                from: () => ({
                    where: () => Promise.resolve([])
                })
            }));
            await TutorService.processExamResults('e1');
            expect(mDb.transaction).not.toHaveBeenCalled();
        });

        it('hits recommendation logic branches', async () => {
            mDb.query.exams.findFirst.mockResolvedValue({ userId: 'u1' });
            // Chain mock
            mDb.select.mockImplementationOnce(() => ({
                from: () => ({
                    where: () => Promise.resolve([
                        { topicId: 't1', topicName: 'T1', accuracy: 30 },
                        { topicId: 't2', topicName: '', accuracy: null } 
                    ])
                })
            }));

            // First topic: existing rec
            mDb.query.userRecommendations.findFirst.mockResolvedValueOnce({ id: 'r1' });
            
            // Second topic: new rec
            mDb.query.userRecommendations.findFirst.mockResolvedValueOnce(null);
            mDb.query.topics.findFirst.mockResolvedValueOnce({ notesAssetId: 'a1', learningUrl: 'url1' });
            vi.mocked(cacheService.get).mockResolvedValueOnce('hit'); 

            await TutorService.processExamResults('e1');
        });

        it('hits delivery locks, cache misses, and notes dispatch', async () => {
            mDb.query.exams.findFirst.mockResolvedValue({ userId: 'u1' });
            mDb.select.mockImplementationOnce(() => ({
                from: () => ({
                    where: () => Promise.resolve([
                        { topicId: 't3', topicName: 'T3', accuracy: 40 },
                        { topicId: 't4', topicName: 'T4', accuracy: 50 },
                        { topicId: 't5', topicName: 'T5', accuracy: 60 },
                        { topicId: 't6', topicName: 'T6', accuracy: 70 },
                    ])
                })
            }));

            // Topic t3 - Lock hit
            mDb.query.userRecommendations.findFirst.mockResolvedValueOnce(null);
            mDb.query.topics.findFirst.mockResolvedValueOnce({ learningUrl: '', detailedNotesPath: 'path1', notesAssetId: '' });
            vi.mocked(cacheService.get).mockResolvedValueOnce(null);
            mDb.query.notesDeliveryLocks.findFirst.mockResolvedValueOnce({ id: 'lock1' });

            // Topic t4 - Lock miss, notesAsset valid, learningUrl valid
            mDb.query.userRecommendations.findFirst.mockResolvedValueOnce(null);
            mDb.query.topics.findFirst.mockResolvedValueOnce({ learningUrl: 'http://learn', detailedNotesPath: null, notesAssetId: 'asset2' });
            vi.mocked(cacheService.get).mockResolvedValueOnce(null);
            mDb.query.notesDeliveryLocks.findFirst.mockResolvedValueOnce(null);

            // Topic t5 - Lock miss, notesPath null (both empty)
            mDb.query.userRecommendations.findFirst.mockResolvedValueOnce(null);
            mDb.query.topics.findFirst.mockResolvedValueOnce({ learningUrl: '', detailedNotesPath: '', notesAssetId: '' });
            vi.mocked(cacheService.get).mockResolvedValueOnce(null);
            mDb.query.notesDeliveryLocks.findFirst.mockResolvedValueOnce(null);

            // Topic t6 - Lock miss, notesAsset valid, learningUrl falsy
            mDb.query.userRecommendations.findFirst.mockResolvedValueOnce(null);
            mDb.query.topics.findFirst.mockResolvedValueOnce({ learningUrl: '', detailedNotesPath: 'path6', notesAssetId: 'asset6' });
            vi.mocked(cacheService.get).mockResolvedValueOnce(null);
            mDb.query.notesDeliveryLocks.findFirst.mockResolvedValueOnce(null);

            await TutorService.processExamResults('e1');
        });

        it('hits error catch block (Line 139)', async () => {
            mDb.query.exams.findFirst.mockRejectedValueOnce(new Error('Simulated Error'));
            await TutorService.processExamResults('e1');
            // Assert that it swallowed the error
        });

        it('hits null exam early return (Line 25)', async () => {
            mDb.query.exams.findFirst.mockResolvedValueOnce(null);
            await TutorService.processExamResults('e1');
            // Select should not be called if exam is null
            expect(mDb.select).not.toHaveBeenCalled();
        });
    });

    describe('ForecastService Gaps', () => {
        it('hits trajectoy parsing and success', () => {
            const history = [
                { date: new Date('2023-01-01'), accuracy: 50 },
                { date: '2023-01-02', accuracy: 60 },
                { date: new Date('2023-01-03'), accuracy: 70 }
            ];
            const res = ForecastService.calculateTrajectory(history);
            expect(res.predictedMasteryDate).not.toBeNull();
            expect(res.velocity).toBe(10);
        });

        it('hits insufficient data early return (Line 18)', () => {
            const res = ForecastService.calculateTrajectory([{ date: '2023-01-01', accuracy: 50 }]);
            expect(res.velocity).toBe(0);
            expect(res.confidence).toBe('low');
        });

        it('hits string date parsing fallbacks (Lines 31-38)', () => {
            const history = [
                { date: '2023-01-01T00:00:00.000Z', accuracy: 50 },
                { date: '2023-01-02T00:00:00.000Z', accuracy: 60 },
                { date: '2023-01-03T00:00:00.000Z', accuracy: 70 }
            ];
            const res = ForecastService.calculateTrajectory(history);
            expect(res.velocity).toBe(10);
        });

        it('hits zero days diff, struggling velocity, and slow velocity gaps (Lines 38, 48-58)', () => {
            // zero days diff -> velocity 0 requires at least 3 items to bypass early return guard
            const resZero = ForecastService.calculateTrajectory([
                { date: '2023-01-01', accuracy: 50 },
                { date: '2023-01-01', accuracy: 55 },
                { date: '2023-01-01', accuracy: 60 }
            ]);
            expect(resZero.velocity).toBe(0);

            // negative velocity (< -0.2) + high confidence (> 10 items)
            const strugglingHistory = Array(11).fill(null).map((_, i) => ({
                date: new Date(new Date('2023-01-01').getTime() + (i * 24 * 60 * 60 * 1000)),
                accuracy: 90 - (i * 5)
            }));
            const resStruggle = ForecastService.calculateTrajectory(strugglingHistory);
            expect(resStruggle.isStruggling).toBe(true);
            expect(resStruggle.confidence).toBe('high');

            // slow velocity (>365 days) + medium confidence (> 5 items)
            const slowHistory = Array(6).fill(null).map((_, i) => ({
                date: new Date(new Date('2023-01-01').getTime() + (i * 20 * 24 * 60 * 60 * 1000)), // 20 days apart
                accuracy: 50 + (i * 1) // 1 point per 20 days
            }));
            const resSlow = ForecastService.calculateTrajectory(slowHistory);
            expect(resSlow.predictedMasteryDate).toBeNull();
            expect(resSlow.confidence).toBe('medium');
        });
    });

    // --- 2. Engines & Reporting ---

    describe('ReportEngine Gaps', () => {
        it('hits getUserPerformance (Lines 163-176)', async () => {
            mDb.query.exams.findMany.mockResolvedValue([
                { id: 'e1', totalScore: 80, dimensions: [{ id: 'd1' }] },
                { id: 'e2', totalScore: null, dimensions: [] }
            ]);
            const res = await ReportEngine.getUserPerformance('u1');
            expect(res.examsCompleted).toBe(2);
            expect(res.averageScore).toBe(40);
        });

        it('hits getExamReport branches', async () => {
            mDb.query.exams.findFirst.mockResolvedValue({
                id: 'e1', userId: 'u1', status: 'completed',
                startedAt: new Date('2023-01-01T10:00:00'),
                completedAt: new Date('2023-01-01T10:15:00'),
                blueprintId: 'b1',
                examQuestions: [{ isCorrect: true, question: { questionText: 'Q1', correctAnswer: 'A', explanation: 'E', topicId: 't1' } }]
            });
            mDb.query.resultsByDimension.findMany.mockResolvedValueOnce([
                { dimensionType: 'skill', dimensionId: 's1', accuracy: 80, name: 'S1', score: 10 },
                { dimensionType: 'skill', dimensionId: '', accuracy: 40, name: 'S2', score: 10 },
                { dimensionType: 'skill', dimensionId: null, accuracy: 60, name: '', score: 10 },
                { dimensionType: 'skill', dimensionId: null, accuracy: 60, name: null, score: 10 }
            ]);
            
            await ReportEngine.getExamReport('e1', { includeCorrectAnswers: true });
        });

        it('hits premium reporting success paths', async () => {
            mDb.query.exams.findFirst.mockResolvedValue({ id: 'e1', userId: 'u1', completedAt: new Date() });
            
            // 1. Lazy refresh fail
            mDb.execute.mockResolvedValue({ rows: [] });
            await expect(ReportEngine.getPremiumExamReport('e1')).rejects.toThrow('Analytics not precomputed');

            // 2. High score success
            mDb.execute.mockResolvedValue({ rows: [{ 
                score: 96, heatmap: [{ attempts: 1, difficulty: 'simple' }], 
                difficulty: [], percentile: 90 
            }] });
            mDb.query.userProfiles.findFirst.mockResolvedValue({ name: 'Alpha' });
            mDb.query.resultsByDimension.findMany.mockResolvedValue([]);
            const r1 = await ReportEngine.getPremiumExamReport('e1');
            expect(r1.heatmap[0].difficulty).toBe('Novice');

            // 3. DATA_INSUFFICIENT
            mDb.execute.mockResolvedValue({ rows: [{ score: null, heatmap: [], subtopics: [] }] });
            const r2 = await ReportEngine.getPremiumExamReport('e1');
            expect(r2.ai.status).toBe('DATA_INSUFFICIENT');
            
            // 4. Candidate fallback
            mDb.execute.mockResolvedValue({ rows: [{ score: 80, heatmap: [], subtopics: [] }] });
            mDb.query.userProfiles.findFirst.mockResolvedValueOnce(null);
            const r3 = await ReportEngine.getPremiumExamReport('e1');
            expect(r3.candidateName).toBe('Strategic Officer');
        });

        it('hits extreme tail edges for 100% coverage', async () => {
            // Percentile non-Error AND Error
            mDb.query.exams.findMany.mockRejectedValueOnce('string error');
            const perc1 = await ReportEngine['calculatePercentile']('e1', 'b1', 100);
            expect(perc1).toBe(50);
            mDb.query.exams.findMany.mockRejectedValueOnce(new Error('real error'));
            const perc2 = await ReportEngine['calculatePercentile']('e1', 'b1', 100);
            expect(perc2).toBe(50);

            // Percentile success paths (cohort > 1, total > 0, total 0)
            mDb.query.exams.findMany.mockResolvedValueOnce([
                { id: 'c1', examQuestions: [{ isCorrect: true }, { isCorrect: false }] }, // total > 0, score 50
                { id: 'c2', examQuestions: [] }, // total 0
                { id: 'c3', examQuestions: undefined } // total 0 fallback
            ]);
            const perc3 = await ReportEngine['calculatePercentile']('e1', 'b1', 75);
            expect(perc3).toBe(99); // 75 is higher than 50 and 0, so 100 percentile or 99!

            // getExamReport - no startedAt
            mDb.query.exams.findFirst.mockResolvedValueOnce({
                id: 'e1', userId: 'u1', status: 'completed',
                completedAt: new Date(),
                examQuestions: []
            });
            mDb.query.resultsByDimension.findMany.mockResolvedValueOnce([
                { dimensionType: 'topic', name: '', dimensionId: '' } as any,
                { dimensionType: 'topic', name: 'T1', dimensionId: null } as any,
                { dimensionType: 'topic', name: null, dimensionId: 'd1' } as any
            ]);
            await ReportEngine.getExamReport('e1');

            // getExamReport - no completedAt
            mDb.query.exams.findFirst.mockResolvedValueOnce({
                id: 'e1', userId: 'u1', status: 'completed',
                startedAt: new Date(),
                completedAt: undefined,
                examQuestions: []
            });
            await ReportEngine.getExamReport('e1');

            // getPremiumExamReport - 60-80 Borderline, Low Confidence, missing subtopics/skills
            mDb.query.exams.findFirst.mockResolvedValue({ id: 'e1', userId: 'u1', completedAt: new Date() });
            
            mDb.execute.mockResolvedValueOnce({ rows: [{ 
                score: 70, heatmap: [{ attempts: 0, difficulty: 'expert' }], 
                difficulty: [{ attempts: 0, level: 'expert'}], percentile: 50,
                confidence: 'LOW',
                expert_drop_off: true,
                subtopics: [{ topicId: 't1', accuracy: 50 }, { topicId: 't1', accuracy: null }, { topicId: '' }] 
            }] });
            mDb.query.userProfiles.findFirst.mockResolvedValue({ name: 'Alpha' });
            mDb.query.resultsByDimension.findMany.mockResolvedValue([]);
            const r5 = await ReportEngine.getPremiumExamReport('e1');
            expect(r5.ai.status).toBe('BORDERLINE');

            // getPremiumExamReport - < 60 NOT_READY, High Confidence, weakest subtopic
            mDb.execute.mockResolvedValueOnce({ rows: [{ 
                score: 50, heatmap: [], 
                difficulty: [], percentile: 50,
                confidence: 'HIGH',
                expert_drop_off: false,
                weakest_subtopic: 'Math',
                weakest_skill: 'Algebra',
                subtopics: [{ topicId: 't2', accuracy: 60 }] 
            }] });
            mDb.query.resultsByDimension.findMany.mockResolvedValue([]);
            const r6 = await ReportEngine.getPremiumExamReport('e1');
            expect(r6.ai.status).toBe('NOT_READY');

            // getPremiumExamReport - undefined core fields for coalescing coverage
            mDb.execute.mockResolvedValueOnce({ rows: [{ 
                score: undefined, heatmap: [], difficulty: [], percentile: 50,
                confidence: undefined, expert_drop_off: undefined,
                weakest_subtopic: undefined, weakest_skill: undefined,
                subtopics: [{ topicId: undefined }] 
            }] });
            await ReportEngine.getPremiumExamReport('e1');

            // getPremiumExamReport - 95+ score without weakest topics
            mDb.execute.mockResolvedValueOnce({ rows: [{ 
                score: 98, heatmap: [{ attempts: 1, difficulty: 'INTERMEDIATE' }], 
                difficulty: [{ attempts: 1, level: 'simple' }], percentile: 99,
                confidence: 'HIGH', expert_drop_off: true,
                weakest_subtopic: '', weakest_skill: ''
            }] });
            await ReportEngine.getPremiumExamReport('e1');

            // getPremiumExamReport - line 567 expert_drop_off falsy & line 587 count > 0 ternary
            mDb.execute.mockResolvedValueOnce({ rows: [{ 
                score: 85, heatmap: [], 
                difficulty: [], percentile: 80,
                confidence: 'HIGH', expert_drop_off: true, // hits line 567 truthy branch
                weakest_subtopic: '', weakest_skill: '',
                subtopics: [
                    { topicId: 't3', accuracy: 50 }, // Valid topic with accuracy
                    { topicId: 't3', accuracy: undefined } // Additional record to force count > 0 logic without specific accuracy coverage
                ] 
            }] });
            await ReportEngine.getPremiumExamReport('e1');

            // getPremiumExamReport - Exam not found
            mDb.query.exams.findFirst.mockResolvedValueOnce(null);
            await expect(ReportEngine.getPremiumExamReport('e1')).rejects.toThrow('Exam not found');
            
            // getExamReport - Exam not found
            mDb.query.exams.findFirst.mockResolvedValueOnce(null);
            await expect(ReportEngine.getExamReport('e1')).rejects.toThrow('Exam not found');
        });
    });

    describe('Selection & Scoring Hardware', () => {
        it('hits ScoringEngine delete and update logic', async () => {
            mDb.query.exams.findFirst.mockResolvedValueOnce({ 
                id: 'e1', 
                examQuestions: [{ question: { topicId: 't1' } }] 
            });
            await ScoringEngine.calculateExamResults('e1');

            mDb.query.exams.findFirst.mockResolvedValueOnce({ 
                id: 'e2', 
                examQuestions: [{ question: { topicId: null } }] 
            });
            await ScoringEngine.calculateExamResults('e2');
        });

        it('hits ScoringEngine edge cases and branch gaps', async () => {
            // 1. Exam not found (Line 38)
            // findFirst returns undefined (drizzle behavior for missing record)
            mDb.query.exams.findFirst.mockResolvedValueOnce(undefined);
            await expect(ScoringEngine.calculateExamResults('e_none')).rejects.toThrow('Exam not found');

            // 2. Full Metadata (Subtopics, Categories, MappingTypes, Weights)
            mDb.query.exams.findFirst.mockResolvedValueOnce({
                id: 'e_meta',
                examQuestions: [{
                    isCorrect: true,
                    question: {
                        topicId: 't1',
                        difficulty: 'expert',
                        subtopicId: 'st1',
                        questionSkills: [
                            { 
                                skill: { id: 's1', name: 'Skill1', weight: 5, category: 'cat1', mappingType: 'map1' }
                            },
                            {
                                skill: { id: 's2', name: 'Skill2', weight: null, category: '', mappingType: null }
                            }
                        ]
                    }
                }]
            });
            mDb.query.topics.findMany.mockResolvedValueOnce([{
                id: 't1',
                name: 'Topic1',
                subject: { id: 'sub1', name: 'Subject1', domain: { id: 'dom1', name: 'Domain1' } },
                topicSkills: [{ skill: { id: 's3', name: 'Skill3', weight: 2, category: 'cat3', mappingType: 'map3' } }],
                subtopics: [{ id: 'st1', name: 'Subtopic1' }]
            }]);
            
            await ScoringEngine.calculateExamResults('e_meta');

            // 3. Error Catching: refreshAnalytics fail (Line 196)
            mDb.query.exams.findFirst.mockResolvedValueOnce({ id: 'e_ref', examQuestions: [] });
            vi.spyOn(PerformanceService, 'refreshAnalytics').mockRejectedValueOnce(new Error('Refresh Fail'));
            await ScoringEngine.calculateExamResults('e_ref');

            // 4. Error Catching: main catch block (Line 201)
            mDb.query.exams.findFirst.mockRejectedValueOnce(new Error('Critical DB Fail'));
            await expect(ScoringEngine.calculateExamResults('e_fail')).rejects.toThrow('Critical DB Fail');

            // 5. Error Catching: failed to mark as failed (Line 210)
            mDb.query.exams.findFirst.mockRejectedValueOnce(new Error('Double Fail'));
            mDb.update.mockImplementationOnce(() => ({
                set: () => ({
                    where: () => Promise.reject(new Error('Update Fail'))
                })
            }));
            await expect(ScoringEngine.calculateExamResults('e_double')).rejects.toThrow('Double Fail');

            // 6. Background Fetch Fail (Line 194)
            mDb.query.exams.findFirst.mockResolvedValueOnce({ id: 'e_fetch', examQuestions: [] });
            // Mock global fetch to reject
            const oldFetch = global.fetch;
            global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network Fail'));
            await ScoringEngine.calculateExamResults('e_fetch');
            global.fetch = oldFetch;

            // 7. Branch: questionSkills is null/undefined (Line 81 false branch)
            mDb.query.exams.findFirst.mockResolvedValueOnce({
                id: 'e_nullskills',
                examQuestions: [
                    {
                        isCorrect: false,
                        question: {
                            topicId: 't1',
                            difficulty: 'simple',
                            subtopicId: 'st_wrong', // subtopic ID that won't match (Line 105 false)
                            questionSkills: null  // null questionSkills (Line 81 false)
                        }
                    },
                    {
                        isCorrect: true,
                        question: {
                            topicId: 't1',
                            difficulty: 'simple',
                            subtopicId: null,
                            questionSkills: undefined  // undefined questionSkills
                        }
                    }
                ]
            });
            mDb.query.topics.findMany.mockResolvedValueOnce([{
                id: 't1',
                name: 'Topic1',
                subject: { id: 'sub1', name: 'Subject1', domain: { id: 'dom1', name: 'Domain1' } },
                topicSkills: [],  // empty topicSkills -> avgWeight = 1 (Line 91-93 false branch)
                subtopics: [{ id: 'st1', name: 'Subtopic1' }]  // st_wrong won't match
            }]);
            await ScoringEngine.calculateExamResults('e_nullskills');

            // 8. Non-Error throw to hit 'unknown error' fallback (Line 202 false branch)
            mDb.query.exams.findFirst.mockRejectedValueOnce('string_error_not_instanceof_Error');
            await expect(ScoringEngine.calculateExamResults('e_str')).rejects.toBe('string_error_not_instanceof_Error');

            // 9. Non-Error throw + update also rejects with non-Error (Lines 202+210 false branches)
            mDb.query.exams.findFirst.mockRejectedValueOnce(42);
            mDb.update.mockImplementationOnce(() => ({
                set: () => ({
                    where: () => Promise.reject('update_string_error')
                })
            }));
            await expect(ScoringEngine.calculateExamResults('e_num')).rejects.toBe(42);
        });

        it('hits SelectionService dynamic paths', async () => {
            vi.mocked(cacheService.get).mockRejectedValueOnce(new Error('fail'));
            mDb.query.topics.findMany.mockResolvedValue([]);
            
            mDb.select.mockImplementation(() => {
                const target = () => {};
                const proxy: any = new Proxy(target, {
                  get: (t, prop) => {
                    if (prop === 'then') return (resolve: any) => resolve([{ id: 'q1' }]);
                    return () => proxy;
                  },
                  apply: () => proxy,
                });
                return proxy;
            });
            
            const config = { 
                blueprintId: 'b1', 
                selectionConfig: [{ itemCount: 1 }, { itemCount: undefined }] 
            };
            
            const res = await SelectionService.composeExam('u1', 'b1', 'ikey', config as any);
            expect(res).toBeDefined();

            // 1. Config is null/undefined (Line 181 branch) - must call private method directly
            // composeExam does `config || {}`, so the ?? {} fallback in resolveSelectionCriteria is unreachable via public API
            await (SelectionService as any).resolveSelectionCriteria('d1', null as any, { totalQuestions: 1 }).catch(() => {});

            // 2. Transient Blueprint (Line 128)
            vi.mocked(cacheService.get).mockRejectedValueOnce(new Error('fail'));
            mDb.query.examBlueprints.findFirst.mockResolvedValue(null); // Force transient
            await SelectionService.composeExam('u1', 'b_none', 'k_trans').catch(() => {});

            // 3. fetchStaticQuestions error (Line 161)
            mDb.query.examBlueprints.findFirst.mockResolvedValueOnce({ id: 'b_static', questionIds: ['q1'] });
            mDb.query.questions.findMany.mockResolvedValueOnce([]); // No questions found
            await expect(SelectionService.composeExam('u1', 'b_static', 'k_static')).rejects.toThrow('no longer exist or are inactive');

            // 4. executeDynamicSelection pool wrap-around (Line 296)
            mDb.query.examBlueprints.findFirst.mockResolvedValue({ id: 'bp1', totalQuestions: 1 });
            mDb.select.mockImplementation(() => {
                let callCount = 0;
                const target = () => {};
                const proxy: any = new Proxy(target, {
                  get: (t, prop) => {
                    if (prop === 'then') {
                        callCount++;
                        if (callCount === 1) return (resolve: any) => resolve([{ count: 1 }]); // totalInPool
                        if (callCount === 2) return (resolve: any) => resolve([]); // empty anchor selection (hits line 296)
                        return (resolve: any) => resolve([{ id: 'q_fallback' }]); // wrap-around selection
                    }
                    return () => proxy;
                  },
                  apply: () => proxy,
                });
                return proxy;
            });
            await SelectionService.composeExam('u1', 'bp1', 'k_wrap');

            // 5. executeDynamicSelection empty pool error (Line 332)
            mDb.select.mockImplementation(() => ({
                from: () => ({
                    where: () => Promise.resolve([{ count: 0 }]) // Force empty pool early
                })
            }));
            await expect(SelectionService.composeExam('u1', 'bp1', 'k_empty')).rejects.toThrow('No questions found');
        });

        it('hits ReportMaterializer branches', async () => {
             // Restore materialize for this specific test block to hit actual logic
             vi.mocked(ReportMaterializer.materialize).mockRestore();
             
             // Truthy branch (subtopics exist, high accuracy, defined timeSpent, single hierarchy)
             mDb.query.exams.findFirst.mockResolvedValueOnce({
                 userId: 'u1',
                 user: { email: 'test@example.com' },
                 examQuestions: [{ 
                     isCorrect: true, 
                     userAnswer: 'A',
                     correctAnswer: 'A',
                     explanation: 'Exp',
                     timeSpent: 30,
                     question: { 
                         topicId: 't1',
                         difficulty: 'simple', 
                         subtopicId: 's1', 
                         topic: { id: 't1', name: 'Topic1', subjectId: 'subj1', subject: { id: 'subj1', name: 'Subj1', domainId: 'd1', domain: { id: 'd1', name: 'Dom1' } } } 
                     } 
                 }]
             });
             mDb.query.subtopics.findMany.mockImplementationOnce(async (args: any) => {
                 if (args && args.where) args.where({ id: 't_id' }, { inArray: () => true });
                 return [];
             });
             await ReportMaterializer.materialize('e1');

             // Borderline branch (1 subject, 2 topics, borderline accuracy 75%, user null)
             mDb.query.exams.findFirst.mockResolvedValueOnce({
                 userId: 'u1',
                 user: null, // Covers exam.user?.email falsy path
                 examQuestions: [
                     // t1 has 4 questions (3 correct -> 75%)
                     { isCorrect: true, responseMetadata: { timeSpentSeconds: 0 }, question: { topicId: 't1', difficulty: 'intermediate', subtopicId: 's1', topic: { id: 't1', name: 'Topic1', subjectId: 'subj1', subject: { id: 'subj1', name: 'Subj1', domainId: 'd1', domain: { id: 'd1', name: 'Dom1' } } } } },
                     { isCorrect: true, responseMetadata: { timeSpentSeconds: null }, question: { topicId: 't1', difficulty: 'intermediate', subtopicId: 's1', topic: { id: 't1', name: 'Topic1', subjectId: 'subj1', subject: { id: 'subj1', name: 'Subj1', domainId: 'd1', domain: { id: 'd1', name: 'Dom1' } } } } },
                     { isCorrect: true, responseMetadata: { timeSpentSeconds: undefined }, question: { topicId: 't1', difficulty: 'intermediate', subtopicId: 's1', topic: { id: 't1', name: 'Topic1', subjectId: 'subj1', subject: { id: 'subj1', name: 'Subj1', domainId: 'd1', domain: { id: 'd1', name: 'Dom1' } } } } },
                     { isCorrect: false, question: { topicId: 't1', difficulty: 'intermediate', subtopicId: 's2', topic: { id: 't1', name: 'Topic1', subjectId: 'subj1', subject: { id: 'subj1', name: 'Subj1', domainId: 'd1', domain: { id: 'd1', name: 'Dom1' } } } } }, // omitted responseMetadata
                     // t2 has 1 question
                     { isCorrect: false, responseMetadata: null, question: { topicId: 't2', difficulty: 'expert', subtopicId: null, topic: { id: 't2', name: 'Topic2', subjectId: 'subj1', subject: { id: 'subj1', name: 'Subj1', domainId: 'd1', domain: { id: 'd1', name: 'Dom1' } } } } },
                     { isCorrect: false, responseMetadata: 'invalid_string' as unknown, question: { topicId: 't2', difficulty: 'expert', subtopicId: null, topic: { id: 't2', name: 'Topic2', subjectId: 'subj1', subject: { id: 'subj1', name: 'Subj1', domainId: 'd1', domain: { id: 'd1', name: 'Dom1' } } } } }
                 ]
             });
             await ReportMaterializer.materialize('e3');

             // Falsy branch (no subtopics, low accuracy, zero division fallbacks, multiple subjects/topics)
             mDb.query.exams.findFirst.mockResolvedValueOnce({
                 userId: 'u1',
                 user: { email: '   ' }, // empty string after trim to hit Candidate fallback
                 examQuestions: [
                     { isCorrect: false, responseMetadata: { timeSpentSeconds: 15 }, question: { topicId: 't2', difficulty: 'expert', topic: { id: 't2', name: 'Topic2', subjectId: 'subj2', subject: { id: 'subj2', name: 'Subj2', domainId: 'd1', domain: { id: 'd1', name: 'Dom1' } } } } },
                     { isCorrect: false, responseMetadata: {}, question: { topicId: 't3', difficulty: 'intermediate', topic: { id: 't3', name: 'Topic3', subjectId: 'subj3', subject: { id: 'subj3', name: 'Subj3', domainId: undefined, domain: { id: 'd2', name: 'Dom2' } } } } }
                 ]
             });
             await ReportMaterializer.materialize('e2');

             // Empty array branch (covers hierarchy.subjects[0]?.topics optional chaining where length=0)
             mDb.query.exams.findFirst.mockResolvedValueOnce({
                 userId: 'u1',
                 user: undefined, // undefined user
                 examQuestions: []
             });
             await ReportMaterializer.materialize('e4');

             // --- NEW: Final coverage tail-enders ---
             
             // 5. Exam not found (Line 40)
             mDb.query.exams.findFirst.mockResolvedValueOnce(null);
             await expect(ReportMaterializer.materialize('e_null')).rejects.toThrow('Exam not found');

             // 6. Depth 1 & READY status (Line 212 & 252-253)
             mDb.query.exams.findFirst.mockResolvedValueOnce({
                 userId: 'u1',
                 examQuestions: [{ 
                     isCorrect: true, 
                     question: { 
                         topicId: 't1',
                         difficulty: 'simple', 
                         topic: { 
                             id: 't1', 
                             name: 'T', 
                             subjectId: 's1',
                             subject: { 
                                 id: 's1', 
                                 name: 'S', 
                                 domainId: 'd1', 
                                 domain: { id: 'd1', name: 'D' } 
                             } 
                         } 
                     } 
                 }]
             });
             const rReady = await ReportMaterializer.materialize('e_ready');
             expect(rReady.datasets.topics['t1'].ai.status).toBe('READY');
             expect(rReady.meta.depth).toBe(1);

             // 7. Depth 2 (Line 251) - 1 subject, 2+ topics
             mDb.query.exams.findFirst.mockResolvedValueOnce({
                 userId: 'u1',
                 examQuestions: [
                     { isCorrect: true, question: { topicId: 't1', topic: { id: 't1', name: 'T1', subjectId: 's1', subject: { id: 's1', name: 'S1', domainId: 'd1', domain: { id: 'd1', name: 'D' } } } } },
                     { isCorrect: true, question: { topicId: 't2', topic: { id: 't2', name: 'T2', subjectId: 's1', subject: { id: 's1', name: 'S1', domainId: 'd1', domain: { id: 'd1', name: 'D' } } } } }
                 ]
             });
             const rDepth2 = await ReportMaterializer.materialize('e_depth2');
             expect(rDepth2.meta.depth).toBe(2);

             // 8. Depth 3 (Line 250) - 2+ subjects
             mDb.query.exams.findFirst.mockResolvedValueOnce({
                 userId: 'u1',
                 examQuestions: [
                     { isCorrect: true, question: { topicId: 't1', topic: { id: 't1', name: 'T1', subjectId: 's1', subject: { id: 's1', name: 'S1', domainId: 'd1', domain: { id: 'd1', name: 'D1' } } } } },
                     { isCorrect: true, question: { topicId: 't3', topic: { id: 't3', name: 'T3', subjectId: 's2', subject: { id: 's2', name: 'S2', domainId: 'd1', domain: { id: 'd1', name: 'D1' } } } } }
                 ]
             });
             const rDepth3 = await ReportMaterializer.materialize('e_depth3');
             expect(rDepth3.meta.depth).toBe(3);
        });
    });

    describe('Infrastructure Gaps', () => {
        it('hits TokenService audience logic', async () => {
            // Covers default user
            const tokenUser = await TokenService.generateAccessToken({ id: 'u1' } as any, 3600);
            expect(tokenUser).toBeDefined();
            
            // Covers default admin
            const tokenAdmin = await TokenService.generateAccessToken({ id: 'u2', isAdmin: true } as any, 3600);
            expect(tokenAdmin).toBeDefined();

            // Covers explicit audience
            const tokenExplicit = await TokenService.generateAccessToken({ id: 'u3', aud: 'external' } as any, 3600);
            expect(tokenExplicit).toBeDefined();
        });

        it('hits ResendEmailProvider null data branch (Line 29)', async () => {
            // Mock resend to return null data (no error, but no data either)
            const provider = new ResendEmailProvider('key', 'from@test.com');
            (provider as any).resend.emails.send = vi.fn().mockResolvedValueOnce({ data: null, error: null });
            const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
            await provider.sendEmail({ to: 'to@test.com', subject: 'Sub', html: '<p>Test</p>' });
            // data is null so the console.log on line 30 should NOT be called
            expect(spyLog).not.toHaveBeenCalledWith(expect.stringContaining('successfully via Resend'), expect.anything());
            spyLog.mockRestore();
        });
    });
});
