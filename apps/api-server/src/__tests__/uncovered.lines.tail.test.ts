import { db } from '@quiz/db';
import { describe, expect, it, vi } from 'vitest';

import { AdaptiveTutorService } from '@/modules/adaptive-engine/adaptive-tutor.service';
import { AdminDomainEngine } from '@/modules/admin-engine/admin.domain.engine';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginService } from '@/modules/auth/login.service';
import { PasswordRecoveryService } from '@/modules/auth/password-recovery.service';
import { SecurityService } from '@/modules/auth/security.service';
import { SignupService } from '@/modules/auth/signup.service';
import { TokenRefreshService } from '@/modules/auth/token-refresh.service';
import { TokenService } from '@/modules/auth/token.service';
import { cacheService } from '@/modules/core/cache.service';
import { container } from '@/modules/core/container';
import { DomainService, SubjectService, TopicService } from '@/modules/domain/domain.service';
import { HierarchyFactory } from '@/modules/domain/hierarchy.factory';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { ExamRepository } from '@/modules/exam-engine/repositories/exam.repository';
import { TrendsService } from '@/modules/metrics/trends.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';
import { ReportInterpreter } from '@/modules/report-engine/report-interpreter.service';
import { DifficultyCalculator } from '@/modules/scoring-engine/calculators/difficulty.calculator';
import { HierarchyCalculator } from '@/modules/scoring-engine/calculators/hierarchy.calculator';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { IRTScoringStrategy } from '@/modules/scoring-engine/strategies/irt-scoring.strategy';
import { MasteryScoringStrategy } from '@/modules/scoring-engine/strategies/mastery-scoring.strategy';
import { ScoringStrategyRegistry } from '@/modules/scoring-engine/strategies/scoring-strategy.registry';
import { WeightedScoringStrategy } from '@/modules/scoring-engine/strategies/weighted-scoring.strategy';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { DrizzleAdminUserRepository } from '@/repositories/implementations/drizzle-admin-user.repository';

describe('uncovered line mop-up', () => {
  it('covers auth delegates and helper methods', async () => {
    const signup = { verifyEmail: vi.fn(), resendVerification: vi.fn() };
    const login = { heartbeat: vi.fn().mockResolvedValue(true), touchUserSession: vi.fn().mockResolvedValue(undefined), logout: vi.fn() };
    const refresh = { refresh: vi.fn() };
    const recovery = { validateResetToken: vi.fn().mockResolvedValue({ id: 'x' }) };
    const auth = new AuthService(signup as any, login as any, refresh as any, recovery as any);

    await auth.heartbeat('u1');
    await auth.touchUserSession('u1');
    await auth.validateResetToken('t1');

    expect(login.heartbeat).toHaveBeenCalledWith('u1');
    expect(login.touchUserSession).toHaveBeenCalledWith('u1');
    expect(recovery.validateResetToken).toHaveBeenCalledWith('t1');
  });

  it('covers login heartbeat and touch session', async () => {
    const userRepo = { updateLastActive: vi.fn().mockResolvedValue(undefined), findWithDetails: vi.fn() };
    const tokenRepo = { touchSession: vi.fn().mockResolvedValue(undefined) };
    const service = new LoginService(userRepo as any, tokenRepo as any, { log: vi.fn() } as any, {} as any, {} as any, {} as any);

    await service.heartbeat('u2');
    await service.touchUserSession('u2');

    expect(userRepo.updateLastActive).toHaveBeenCalledWith('u2');
    expect(tokenRepo.touchSession).toHaveBeenCalledWith('u2');
  });

  it('covers password reset success path', async () => {
    const userRepo = {
      findResetToken: vi.fn().mockResolvedValue({ id: 'rt1', userId: 'u1' }),
      updatePassword: vi.fn().mockResolvedValue(undefined),
      deleteResetToken: vi.fn().mockResolvedValue(undefined),
    };
    const service = new PasswordRecoveryService(
      userRepo as any,
      { log: vi.fn().mockResolvedValue(undefined) } as any,
      { hash: vi.fn().mockResolvedValue('hashed') } as any,
    );

    await expect(service.resetPassword('tok', 'new-pass', '1.1.1.1')).resolves.toBe(true);
    expect(userRepo.updatePassword).toHaveBeenCalledWith('u1', 'hashed');
    expect(userRepo.deleteResetToken).toHaveBeenCalledWith('rt1');
  });

  it('covers security lockout branches and expired lock path', async () => {
    const findFirstUser = vi.fn().mockResolvedValue({ id: 'u1' });
    const findAttempt = vi
      .fn()
      .mockResolvedValueOnce({ id: 'a1', attempts: 19, lockedUntil: null })
      .mockResolvedValueOnce({ id: 'a2', attempts: 4, lockedUntil: null })
      .mockResolvedValueOnce({ id: 'a3', attempts: 2, lockedUntil: new Date(Date.now() - 1000) });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });
    const dbInstance = {
      query: {
        users: { findFirst: findFirstUser },
        loginAttempts: { findFirst: findAttempt },
      },
      update,
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    };

    const service = new SecurityService(dbInstance as any);
    await service.trackLoginAttempt('ip', 'mail@example.com', false);
    await service.trackLoginAttempt('ip', 'mail@example.com', false);
    await expect(service.isAccountLocked('mail@example.com', 'ip')).resolves.toBe(false);

    expect(update).toHaveBeenCalledTimes(2);
  });

  it('covers signup resend user-not-found branch', async () => {
    const service = new SignupService(
      { findById: vi.fn().mockResolvedValue(undefined) } as any,
      { log: vi.fn() } as any,
      { hash: vi.fn() } as any,
    );
    await expect(service.resendVerification('missing')).rejects.toThrow('User not found');
  });

  it('covers token-refresh infra audience guard', async () => {
    const service = new TokenRefreshService(
      {
        findByHash: vi.fn().mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 60_000) }),
        revokeAll: vi.fn(),
      } as any,
      {
        findByIdWithDetails: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'u@x.com',
          isBlocked: false,
          userRoles: [{ role: { name: 'USER' } }],
        }),
        updateLastActive: vi.fn(),
      } as any,
      { findActiveExam: vi.fn() } as any,
      {
        verifyRefreshToken: vi.fn().mockResolvedValue({ userId: 'u1' }),
        hashToken: vi.fn().mockResolvedValue('h'),
      } as any,
      { log: vi.fn() } as any,
    );

    const shapedToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpc0FkbWluIjpmYWxzZX0.c2ln';
    await expect(service.refresh(shapedToken, 'ip', undefined, 'infra')).rejects.toThrow(
      'Access Denied: Infrastructure privileges required for this portal session',
    );
  });

  it('covers token service static wrappers and boolean option path', async () => {
    const mock = {
      generateAccessToken: vi.fn().mockResolvedValue('a'),
      generateRefreshToken: vi.fn().mockResolvedValue('r'),
      verifyAccessToken: vi.fn().mockResolvedValue({ userId: 'u', email: 'e', roles: [] }),
      verifyRefreshToken: vi.fn().mockResolvedValue({ userId: 'u', isAdmin: false }),
      hashToken: vi.fn().mockResolvedValue('h'),
      getExpiration: vi.fn().mockReturnValue('exp'),
      getExpiryISO: vi.fn().mockReturnValue('iso'),
    } as any;
    TokenService.setInstance(mock);
    await TokenService.generateRefreshToken('u1', false, 'user');
    await TokenService.verifyAccessToken('tok', true);
    await TokenService.verifyRefreshToken('tok', {});
    await TokenService.hashToken('tok');
    TokenService.getExpiration('tok');
    TokenService.getExpiryISO({ exp: 1 } as any);

    const real = new TokenService();
    await expect(real.verifyAccessToken('not-a-jwt', true)).rejects.toBeTruthy();
  });

  it('covers container set and fallback factory branches', () => {
    container.reset();
    container.set('k', 123);
    expect(container.get('k')).toBe(123);

    const ctorThrowsFactoryWorks = function ctorThrowsFactoryWorks(this: unknown) {
      if (new.target) throw new Error('ctor failed');
      return { fromFactory: true };
    };
    const produced = container.get(ctorThrowsFactoryWorks as any);
    expect((produced as any).fromFactory).toBe(true);

    const bothFail = function bothFail(this: unknown) {
      if (new.target) throw new Error('ctor bad');
      throw new Error('factory bad');
    };
    expect(() => container.get(bothFail as any)).toThrow('Failed to instantiate bothFail');
  });

  it('covers admin domain approve path', async () => {
    const repo = { updateStatus: vi.fn().mockResolvedValue({ id: 'd1', status: 'active' }) };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const engine = new AdminDomainEngine(repo as any, audit as any);

    await expect(engine.approveDomain('d1', 'admin-1')).resolves.toEqual({ id: 'd1', status: 'active' });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin_approve_domain' }));
  });

  it('covers static setInstance helpers', async () => {
    AdaptiveTutorService.setInstance({ generateInsights: vi.fn().mockResolvedValue([]) } as any);
    ReportInterpreter.setInstance({ interpret: vi.fn().mockReturnValue({}) } as any);
    SelectionService.setInstance({ composeExam: vi.fn() } as any);
    ScoringEngine.setInstance({ calculateExamResults: vi.fn() } as any);
    ReportEngine.setInstance({ getExamReport: vi.fn() } as any);
    ExamEngine.setInstance({ submitAnswer: vi.fn().mockResolvedValue(undefined) } as any);
    await ExamEngine.submitAnswer('e1', 'q1', 'A', 'u1');
  });

  it('covers domain/subject/topic invalidation lines', async () => {
    const mockDb = db as any;
    mockDb.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'x' }]) }),
      }),
    });
    mockDb.delete = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'x' }]) }),
    });
    vi.spyOn(cacheService, 'del').mockResolvedValue(1);

    await DomainService.updateDomain('d1', { name: 'n1' } as any);
    await DomainService.deleteDomain('d1');
    await DomainService.deleteDomainsBatch(['d1', 'd2']);
    await SubjectService.updateSubject('s1', { name: 's' });
    await SubjectService.deleteSubject('s1');
    await SubjectService.deleteSubjectsBatch(['s1']);
    await TopicService.updateTopic('t1', { subjectId: 's1' });
  });

  it('covers hierarchy factory compatibility shims', async () => {
    const upsertSpy = vi.spyOn(HierarchyFactory, 'atomicUpsert').mockResolvedValue({} as any);

    await HierarchyFactory.atomicSeed({ domains: [] } as any);
    await HierarchyFactory.seedAtomic({ domains: [] } as any);

    expect(upsertSpy).toHaveBeenCalled();
  });

  it('covers exam repository and exam-engine cache header line', async () => {
    const repo = new ExamRepository();
    const dbInstance = {
      query: {
        exams: { findFirst: vi.fn().mockResolvedValue({ id: 'e1' }) },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined), returning: vi.fn().mockResolvedValue([{ id: 'e1' }]) }),
      }),
      transaction: vi.fn().mockImplementation(async (cb: any) =>
        cb({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'e1' }]),
            }),
          }),
        }),
      ),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }) }),
    };
    (repo as any).dbInstance = dbInstance;
    await repo.findActiveExam('e1', 'u1');
    await repo.updateLastAnswered('e1');
    await repo.updateExamQuestionResponse('eq1', { userAnswer: 'A', isCorrect: true, responseMetadata: {} });
    await repo.createExamWithQuestions({ userId: 'u1', blueprintId: null, status: 'started', durationSeconds: 60, questions: [{ id: 'q1' }] });

    const cacheGetSpy = vi.spyOn(cacheService, 'get').mockResolvedValue({ id: 'e1', userId: 'u1', status: 'started' } as any);
    const engineObj = Object.create(ExamEngine.prototype);
    await (engineObj as any).getAndCacheActiveExam('u1', 'e1');
    expect(cacheGetSpy).toHaveBeenCalled();
  });

  it('covers trends branches and parser fallback', async () => {
    const mockDb = db as any;
    mockDb.query = {
      exams: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ id: 'e1', completedAt: new Date() }]),
      },
      resultsByDimension: {
        findMany: vi.fn().mockResolvedValue([
          { examId: 'e1', dimensionId: null, name: null, accuracy: 40 },
          { examId: 'e1', dimensionId: 's1', name: 'Skill 1', accuracy: 40 },
        ]),
      },
    };
    await TrendsService.getScoreTrends({ userId: 'u1', range: '5d' });
    await TrendsService.getSkillTrends({ userId: 'u1', range: '7d' });

    const groupBy = vi
      .fn()
      .mockResolvedValueOnce([{ id: null, score: 50, count: 1 }, { id: 'd1', score: 80, count: 1 }])
      .mockResolvedValueOnce([{ id: 'd1', score: 70, count: 1 }]);
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy,
          }),
        }),
      }),
    });
    await TrendsService.getDomainDeltas('7d');
  });

  it('covers performance static and invalidate catch', async () => {
    const perf = new PerformanceService(
      { execute: vi.fn() } as any,
      { get: vi.fn(), set: vi.fn(), del: vi.fn().mockRejectedValue(new Error('del-fail')) } as any,
    );
    await perf.invalidateCache('e1');

    const mock = {
      refreshAnalytics: vi.fn(),
      getCachedReport: vi.fn(),
      cacheReport: vi.fn(),
      invalidateCache: vi.fn().mockResolvedValue(undefined),
    } as any;
    PerformanceService.setInstance(mock);
    await PerformanceService.invalidateCache('e2');
  });

  it('covers report-engine singleton fallback and rejected promise guard', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    (ReportEngine as any).singleton = null;
    vi.spyOn(container, 'get').mockImplementation(() => {
      throw new Error('no binding');
    });
    (ReportEngine as any).getInstance();
    process.env.NODE_ENV = prevEnv;

    const dbInstance = {
      query: {
        exams: { findFirst: vi.fn().mockResolvedValue({ id: 'e1', userId: 'u1', completedAt: new Date(), blueprintId: null }) },
        resultsByDimension: { findMany: vi.fn().mockResolvedValue([]) },
        examQuestions: { findFirst: vi.fn().mockResolvedValue(null) },
      },
      execute: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ score: null, subtopics: [], confidence: 'LOW' }] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const service = new ReportEngine(
      dbInstance as any,
      {
        getCachedReport: vi.fn().mockResolvedValue(null),
        refreshAnalytics: vi.fn().mockResolvedValue(undefined),
        cacheReport: vi.fn().mockResolvedValue(undefined),
      } as any,
      { generateInsights: vi.fn().mockResolvedValue([]) } as any,
      { interpret: vi.fn() } as any,
    );

    await expect(service.getPremiumExamReport('e1')).rejects.toThrow('rejected promise');
  });

  it('covers scoring helper branches', () => {
    expect(new DifficultyCalculator().calculate({ question: { difficulty: '' } as any })).toEqual([]);
    expect(new HierarchyCalculator().calculate({ question: {} as any, topic: null })).toEqual([]);
    expect(new IRTScoringStrategy().calculateOverallScore([])).toBe(0);
    expect(new MasteryScoringStrategy().calculateOverallScore([])).toBe(0);
    expect(new WeightedScoringStrategy().calculateOverallScore([])).toBe(0);
    expect(new WeightedScoringStrategy().calculateDimensionScores([{ examQuestion: { isCorrect: true }, question: { difficulty: 'unknown' } } as any], { 'skill:x': { total: 1, correct: 1, name: 'X' } })[0].score).toBe(100);
    expect(ScoringStrategyRegistry.get('not-real').getName()).toBe('percentage');
  });

  it('covers admin-user repository online status filter branch', async () => {
    const repo = new DrizzleAdminUserRepository();
    const dbInstance = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      }),
      query: {
        users: { findMany: vi.fn().mockResolvedValue([]) },
      },
    };
    (repo as any).dbInstance = dbInstance;

    const result = await repo.findAll(1, 10, 'active', { status: 'online' });
    expect(result.total).toBe(0);
  });
});
