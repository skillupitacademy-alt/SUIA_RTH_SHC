import { db } from '@quiz/db';
import { SignJWT } from 'jose';
import { describe, expect, it, vi } from 'vitest';

import { container } from '@/modules/core/container';
import { TrendsService } from '@/modules/metrics/trends.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { TokenService } from '@/modules/auth/token.service';
import { DrizzleAdminAnalyticsRepository } from '@/repositories/implementations/drizzle-admin-analytics.repository';
import { DrizzleAdminUserRepository } from '@/repositories/implementations/drizzle-admin-user.repository';

describe('uncovered branch mop-up', () => {
  it('covers token service audience mismatch and admin audience violation', async () => {
    const svc = new TokenService();
    const userToken = await svc.generateAccessToken({
      userId: 'u1',
      email: 'u1@test.com',
      roles: ['USER'],
      isAdmin: false,
      aud: 'user',
    });

    await expect(svc.verifyUserAccessToken(userToken, { audience: 'admin' })).rejects.toThrow(
      'Audience mismatch: expected admin',
    );

    const invalidAdminAud = await new SignJWT({
      userId: 'u1',
      email: 'admin@test.com',
      roles: ['ADMIN'],
      isAdmin: true,
      aud: 'weird',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience('weird')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(TokenService.ADMIN_SECRET);

    await expect(svc.verifyAdminAccessToken(invalidAdminAud)).rejects.toThrow(
      'Audience violation: admin scope received unexpected aud',
    );
  });

  it('covers token static verifyRefreshToken default options path', async () => {
    const token = await new TokenService().generateRefreshToken('u2', false, 'user');
    await expect(TokenService.verifyRefreshToken(token)).resolves.toMatchObject({ userId: 'u2', isAdmin: false });
  });

  it('covers selection resolve criteria auto difficulty/count branches', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    const svc = new SelectionService(mockDb as any, {} as any);
    SelectionService.setInstance(svc as any);

    const blueprint = { subjects: [], topics: [], subtopics: [], totalQuestions: 25 } as any;
    const fromSubtopic = await SelectionService.resolveSelectionCriteria('d1', { subtopicIds: ['st1'] }, blueprint);
    expect(fromSubtopic.requestedTotal).toBe(10);
    expect(fromSubtopic.difficultyPref).toBe('mixed');

    const fromTopic = await SelectionService.resolveSelectionCriteria('d1', { topicIds: ['t1'] }, blueprint);
    expect(fromTopic.requestedTotal).toBe(10);
    expect(fromTopic.difficultyPref).toBe('simple');
  });

  it('covers trends declining branch', async () => {
    const mockDb = db as any;
    mockDb.query = {
      exams: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'e2', completedAt: new Date('2026-01-02') },
          { id: 'e1', completedAt: new Date('2026-01-01') },
        ]),
      },
      resultsByDimension: {
        findMany: vi.fn().mockResolvedValue([
          { examId: 'e2', dimensionType: 'skill', dimensionId: 's1', name: 'Skill 1', accuracy: 40 },
          { examId: 'e1', dimensionType: 'skill', dimensionId: 's1', name: 'Skill 1', accuracy: 70 },
        ]),
      },
    };

    const trends = await TrendsService.getSkillTrends({ range: '7d' });
    expect(trends[0].trend).toBe('declining');
    expect(trends[0].delta).toBe(-30);
  });

  it('covers analytics repository activeUsers undefined fallback', async () => {
    const repo = new DrizzleAdminAnalyticsRepository();
    const dbInstance = {
      select: vi
        .fn()
        .mockReturnValueOnce({ from: vi.fn().mockResolvedValue([{ count: 1 }]) })
        .mockReturnValueOnce({ from: vi.fn().mockResolvedValue([{ count: 2 }]) })
        .mockReturnValueOnce({ from: vi.fn().mockResolvedValue([{ count: 3 }]) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
      query: { auditLogs: { findMany: vi.fn() }, domains: { findMany: vi.fn() } },
    };
    (repo as any).dbInstance = dbInstance;

    await expect(repo.getPlatformMetrics()).resolves.toEqual({
      totalUsers: 1,
      totalExams: 2,
      totalDomains: 3,
      activeUsers24h: 0,
    });
  });

  it('covers admin user repository idle branch and count fallback', async () => {
    const repo = new DrizzleAdminUserRepository();
    const dbInstance = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{}]),
        }),
      }),
      query: { users: { findMany: vi.fn().mockResolvedValue([]) } },
    };
    (repo as any).dbInstance = dbInstance;
    await expect(repo.findAll(1, 10, 'active', { status: 'idle' })).resolves.toMatchObject({ total: 0, users: [] });
  });

  it('covers report engine tutor fallback branch in getExamReport', async () => {
    const dbInstance = {
      query: {
        exams: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'e1',
            userId: 'u1',
            status: 'completed',
            completedAt: new Date(),
            startedAt: new Date(Date.now() - 60000),
            blueprintId: 'b1',
            blueprint: { id: 'b1' },
            examQuestions: [
              {
                isCorrect: true,
                userAnswer: 'A',
                responseMetadata: {},
                question: { questionText: 'Q?', correctAnswer: 'A', explanation: 'ex', type: 'mcq' },
              },
            ],
          }),
        },
        resultsByDimension: {
          findMany: vi.fn().mockResolvedValue([
            { dimensionType: 'topic', dimensionId: 't1', name: 'Topic 1', score: 80, accuracy: 80 },
          ]),
        },
      },
    };

    const tutorSpy = vi.spyOn((await import('@/modules/adaptive-engine/adaptive-tutor.service')).AdaptiveTutorService, 'generateInsights')
      .mockResolvedValue([]);

    const engine = new ReportEngine(dbInstance as any, undefined, undefined, undefined);
    await engine.getExamReport('e1');
    expect(tutorSpy).toHaveBeenCalled();
  });

  it('covers report engine singleton container-hit branch', async () => {
    const mock = { getUserPerformance: vi.fn().mockResolvedValue({ examsCompleted: 0, averageScore: 0, dimensions: [] }) };
    vi.spyOn(container, 'get').mockReturnValue(mock as any);
    (ReportEngine as any).singleton = null;
    process.env.NODE_ENV = 'production';
    await expect(ReportEngine.getUserPerformance('u1')).resolves.toEqual({
      examsCompleted: 0,
      averageScore: 0,
      dimensions: [],
    });
  });
});
