/* eslint-disable @typescript-eslint/no-explicit-any */
import { container } from '@/modules/core/container';
import { TrendsService } from '@/modules/metrics/trends.service';
import { DrizzleAdminAnalyticsRepository } from '@/repositories/implementations/drizzle-admin-analytics.repository';
import { IAdminAnalyticsRepository } from '@/repositories/interfaces/admin-analytics.repository.interface';

export interface ExamActivityReport {
  started: number;
  completed: number;
  abandoned: number;
  byDomain: { name: string | null; count: number }[];
  avgCompletionTimeMinutes: number;
}

export class AdminAnalyticsEngine {
  constructor(
    private readonly repository: IAdminAnalyticsRepository = container.get(DrizzleAdminAnalyticsRepository)
  ) {}

  async getPlatformMetrics() {
    return await this.repository.getPlatformMetrics();
  }

  async getExamActivity(): Promise<ExamActivityReport> {
    const result = await this.repository.getExamActivity();

    const base = result.statusStats.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.status] = Number(curr.count ?? 0);
      return acc;
    }, { started: 0, completed: 0, abandoned: 0 });

    return {
      ...base,
      byDomain: result.domainActivity.map((d: any) => ({ name: d.domainName, count: Number(d.count ?? 0) })),
      avgCompletionTimeMinutes: Math.round(Number(result.avgTime ?? 0) / 60)
    } as ExamActivityReport;
  }

  async getEfficiencyAnalytics() {
    const counts = await this.repository.getEfficiencyAnalytics();

    return {
      mastery: counts.find((c: any) => c.quadrant === 'mastery')?.count ?? 0,
      persistence: counts.find((c: any) => c.quadrant === 'persistence')?.count ?? 0,
      rash: counts.find((c: any) => c.quadrant === 'rash')?.count ?? 0,
      struggle: counts.find((c: any) => c.quadrant === 'struggle')?.count ?? 0,
      noData: counts.find((c: any) => c.quadrant === 'no_data')?.count ?? 0,
      total: counts.reduce((acc: number, curr: any) => acc + curr.count, 0)
    };
  }

  async getPerformanceAnalytics(range: string = '7d') {
    // Analytics that are too complex/materialized stay partially in repository or use specialized services
    // For now, I'll keep the orchestration of multiple sources here
    const [
        efficiency,
        trendSummaryResult,
        deltaDataResult,
        domainDeltasResult
    ] = await Promise.allSettled([
        this.getEfficiencyAnalytics(),
        TrendsService.getTrendSummary({ range }),
        TrendsService.getPeriodDelta(undefined, range),
        TrendsService.getDomainDeltas(range)
    ]);

    // Materialized view queries would eventually go to repository too
    // For now, I'll use direct db for MV just to keep it moving, or better, add to repository
    const { db } = await import('@quiz/db');
    const { sql } = await import('drizzle-orm');
    
    // Actually, I already added getPerformanceAnalytics needs to repository? No, I'll add them now or just use db here.
    // Let's add them to the repository for consistency.
    
    const [domainScores, difficultyScores, passFail] = await Promise.all([
        db.execute(sql`SELECT dimension_id as "dimensionId", name, avg_accuracy as "avgAccuracy", sample_size as "count" FROM mv_mastery_matrix WHERE dimension_type = 'domain'`),
        db.execute(sql`SELECT name as difficulty, avg_accuracy as "avgAccuracy" FROM mv_mastery_matrix WHERE dimension_type = 'difficulty'`),
        db.execute(sql`SELECT (avg_accuracy >= 70) as "isPass", SUM(sample_size) as count FROM mv_mastery_matrix WHERE dimension_type = 'domain' GROUP BY (avg_accuracy >= 70)`)
    ]);

    interface DomainRow { dimensionId: string | null; name: string | null; avgAccuracy: number; count: number; }
    interface DifficultyRow { difficulty: string; avgAccuracy: number; }
    interface PassFailItem { isPass: boolean; count: number; }

    const domainsData = domainScores.rows as unknown as DomainRow[];
    const difficulties = difficultyScores.rows as unknown as DifficultyRow[];
    const passFailData = passFail.rows as unknown as PassFailItem[];
    
    const efficiencyData = efficiency.status === 'fulfilled' ? efficiency.value : {
        mastery: 0, persistence: 0, rash: 0, struggle: 0, noData: 0, total: 0
    };

    const trendSummary = trendSummaryResult.status === 'fulfilled' ? trendSummaryResult.value : {
        avgScore: 0, passRate: 0, totalExams: 0, bestSkill: null, worstSkill: null, currentStreak: 0
    };

    const deltaData = deltaDataResult.status === 'fulfilled' ? deltaDataResult.value : null;
    const domainDeltas = domainDeltasResult.status === 'fulfilled' ? (domainDeltasResult.value as Record<string, { delta: number }>) : {};
    const healthStatus = TrendsService.getExecHealth(trendSummary.avgScore, deltaData?.deltaPct ?? null);

    return {
      domains: domainsData.map(d => ({
        id: d.dimensionId,
        name: d.name,
        avgAccuracy: Math.round(Number(d.avgAccuracy ?? 0)),
        sampleSize: Number(d.count ?? 0),
        delta: (d.dimensionId !== null && d.dimensionId !== undefined && domainDeltas[d.dimensionId] !== undefined) ? domainDeltas[d.dimensionId].delta : 0
      })),
      difficulty: difficulties.map(d => ({
        level: d.difficulty,
        avgAccuracy: Math.round(Number(d.avgAccuracy ?? 0))
      })),
      passFailTrends: {
        pass: Number(passFailData.find((p: PassFailItem) => p.isPass === true)?.count ?? 0),
        fail: Number(passFailData.find((p: PassFailItem) => p.isPass === false)?.count ?? 0)
      },
      efficiency: efficiencyData,
      summary: {
          ...trendSummary,
          deltaPct: deltaData?.deltaPct ?? null,
          healthStatus
      }
    };
  }

  async getRecentAuditLogs(limit: number = 20) {
    return await this.repository.getAuditLogs(limit);
  }

  async getBlueprintMetrics() { return { total: 0, active: 0, popular: [] }; }

  async getContentHealthReport() {
    const allDomains = await this.repository.getAllDomainHierarchy();

    const calculateStats = (qs: any[]) => {
      const stats = {
        total: qs.length,
        simple: qs.filter(q => q.difficulty === 'simple').length,
        intermediate: qs.filter(q => q.difficulty === 'intermediate').length,
        expert: qs.filter(q => q.difficulty === 'expert').length,
        isReady: qs.length >= 10
      };
      return stats;
    };

    return allDomains.map(domain => {
      const domainQuestions: any[] = [];
      const subjectsResults = domain.subjects.map((subject: any) => {
        const subjectQuestions: any[] = [];
        const topicsResults = subject.topics.map((topic: any) => {
          subjectQuestions.push(...topic.questions.map((q: any) => ({ difficulty: q.difficulty, subtopicId: q.subtopicId })));
          return {
            id: topic.id,
            name: topic.name,
            stats: calculateStats(topic.questions.map((q: any) => ({ difficulty: q.difficulty, subtopicId: q.subtopicId }))),
            subtopics: topic.subtopics.map((st: any) => ({
              id: st.id,
              name: st.name,
              stats: calculateStats(topic.questions.filter((q: any) => q.subtopicId === st.id).map((q: any) => ({ difficulty: q.difficulty, subtopicId: q.subtopicId })))
            }))
          };
        });
        domainQuestions.push(...subjectQuestions);
        return {
          id: subject.id,
          name: subject.name,
          stats: calculateStats(subjectQuestions),
          topics: topicsResults
        };
      });

      return {
        domainId: domain.id,
        domainName: domain.name,
        stats: calculateStats(domainQuestions),
        subjects: subjectsResults
      };
    });
  }
  async getGrowthZones() { return { areas: [] }; }
  async getRBACMetrics() {
    return await this.repository.getRBACMetrics();
  }
  async getSecuritySignals() { return { threats: [], status: 'nominal' as const }; }
  async getAccountMetrics() { return { active: 0, new: 0, churn: 0 }; }
  async getLiveSessions() { return { active: 0, peak24h: 0 }; }
}
