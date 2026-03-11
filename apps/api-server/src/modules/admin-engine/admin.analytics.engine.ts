import { db, REPORT_QUERY_TIMEOUT, withTimeout } from '@quiz/db';
import { sql } from 'drizzle-orm';

import { TOKENS } from '@/lib/app.container';
import { container } from '@/modules/core/container';
import { TrendsService } from '@/modules/metrics/trends.service';
import { IAdminAnalyticsRepository } from '@/repositories/interfaces/admin-analytics.repository.interface';

type StatusStat = { status: string; count: number };
type DomainActivityItem = { domainName: string; count: number };
type EfficiencyStat = { quadrant: 'mastery' | 'persistence' | 'rash' | 'struggle' | 'no_data'; count: number };
type DomainNode = {
  id: string;
  name: string;
  subjects: SubjectNode[];
};
type SubjectNode = {
  id: string;
  name: string;
  topics: TopicNode[];
};
type TopicNode = {
  id: string;
  name: string;
  questions: QuestionNode[];
  subtopics: SubtopicNode[];
};
type SubtopicNode = { id: string; name: string };
type QuestionNode = { difficulty: string; subtopicId: string | null };

export interface ExamActivityReport {
  started: number;
  completed: number;
  abandoned: number;
  byDomain: { name: string | null; count: number }[];
  avgCompletionTimeMinutes: number;
}

export class AdminAnalyticsEngine {
  constructor(
    private readonly repository: IAdminAnalyticsRepository = container.get(TOKENS.AdminAnalyticsRepo)
  ) {}

  /**
   * Returns a new instance of the engine using the specified database client.
   * Useful for CQRS read-side (dbReadOnly).
   */
  withDb(dbClient: typeof db): AdminAnalyticsEngine {
    return new AdminAnalyticsEngine(this.repository.withDb(dbClient));
  }

  async getPlatformMetrics() {
    return await withTimeout(
        this.repository.getPlatformMetrics(),
        REPORT_QUERY_TIMEOUT,
        'AdminAnalyticsEngine.getPlatformMetrics'
    );
  }

  async getExamActivity(): Promise<ExamActivityReport> {
    const result = await withTimeout(
        this.repository.getExamActivity(),
        REPORT_QUERY_TIMEOUT,
        'AdminAnalyticsEngine.getExamActivity'
    );

    const statusStats = result.statusStats as StatusStat[];
    const base = statusStats.reduce((acc: Record<string, number>, curr: StatusStat) => {
      acc[curr.status] = Number(curr.count ?? 0);
      return acc;
    }, { started: 0, completed: 0, abandoned: 0 });

    return {
      ...base,
      byDomain: (result.domainActivity as DomainActivityItem[]).map((d) => ({ name: d.domainName, count: Number(d.count ?? 0) })),
      avgCompletionTimeMinutes: Math.round(Number(result.avgTime ?? 0) / 60)
    } as ExamActivityReport;
  }

  async getEfficiencyAnalytics() {
    const counts = (await this.repository.getEfficiencyAnalytics()) as EfficiencyStat[];

    return {
      mastery: counts.find((c) => c.quadrant === 'mastery')?.count ?? 0,
      persistence: counts.find((c) => c.quadrant === 'persistence')?.count ?? 0,
      rash: counts.find((c) => c.quadrant === 'rash')?.count ?? 0,
      struggle: counts.find((c) => c.quadrant === 'struggle')?.count ?? 0,
      noData: counts.find((c) => c.quadrant === 'no_data')?.count ?? 0,
      total: counts.reduce((acc: number, curr) => acc + curr.count, 0)
    };
  }

  async getPerformanceAnalytics(range: string = '7d') {
    try {
      // Optimized: Leverage TrendsService for consolidated trend metrics
      const [
          efficiency,
          trendSummary,
          domainDeltas
      ] = await Promise.all([
          this.getEfficiencyAnalytics(),
          TrendsService.getTrendSummary({ range }),
          TrendsService.getDomainDeltas(range)
      ]);

      const [domainScores, difficultyScores, passFail] = await withTimeout(
          Promise.all([
              db.execute(sql`SELECT dimension_id as "dimensionId", name, avg_accuracy as "avgAccuracy", sample_size as "count" FROM mv_mastery_matrix WHERE dimension_type = 'domain'`),
              db.execute(sql`SELECT name as difficulty, avg_accuracy as "avgAccuracy" FROM mv_mastery_matrix WHERE dimension_type = 'difficulty'`),
              db.execute(sql`SELECT (avg_accuracy >= 70) as "isPass", SUM(sample_size) as count FROM mv_mastery_matrix WHERE dimension_type = 'domain' GROUP BY (avg_accuracy >= 70)`)
          ]),
          REPORT_QUERY_TIMEOUT,
          'AdminAnalyticsEngine.getPerformanceAnalytics.fetchMatrix'
      );

      interface DomainRow { dimensionId: string | null; name: string | null; avgAccuracy: number; count: number; }
      interface DifficultyRow { difficulty: string | null; avgAccuracy: number | null; }
      interface PassFailItem { isPass: boolean; count: number; }

      const domainsData = Array.isArray((domainScores as unknown as Record<string, unknown>)?.rows)
        ? (domainScores as unknown as Record<string, unknown>).rows as unknown as DomainRow[]
        : Array.isArray(domainScores)
          ? domainScores as unknown as DomainRow[]
          : (domainScores !== null && domainScores !== undefined ? [domainScores as unknown as DomainRow] : []);
      const difficulties = Array.isArray((difficultyScores as unknown as Record<string, unknown>)?.rows)
        ? (difficultyScores as unknown as Record<string, unknown>).rows as unknown as DifficultyRow[]
        : Array.isArray(difficultyScores)
          ? difficultyScores as unknown as DifficultyRow[]
          : (difficultyScores !== null && difficultyScores !== undefined ? [difficultyScores as unknown as DifficultyRow] : []);
      const passFailData = Array.isArray((passFail as unknown as Record<string, unknown>)?.rows)
        ? (passFail as unknown as Record<string, unknown>).rows as unknown as PassFailItem[]
        : Array.isArray(passFail)
          ? passFail as unknown as PassFailItem[]
          : (passFail !== null && passFail !== undefined ? [passFail as unknown as PassFailItem] : []);
      
      const healthStatus = TrendsService.getExecHealth(trendSummary.avgScore, trendSummary.bestSkill ? 5 : 0); // Placeholder for health logic if delta unavailable
      const hasMatrixData = domainsData.length > 0 || difficulties.length > 0 || passFailData.length > 0 || trendSummary.totalExams > 0;
      const normalizedDomains = (domainsData.length === 0 && hasMatrixData)
        ? [{ dimensionId: null, name: null, avgAccuracy: 0, count: 0 } as DomainRow]
        : domainsData;
      const normalizedDifficulties = (difficulties.length === 0 && trendSummary.totalExams > 0)
        ? [{ difficulty: 'simple', avgAccuracy: 0 } as DifficultyRow]
        : difficulties;

      return {
        domains: normalizedDomains.map(d => ({
          id: d.dimensionId ?? null,
          name: d.name ?? null,
          avgAccuracy: Math.round(Number(d.avgAccuracy ?? 0)),
          sampleSize: Number(d.count ?? 0),
          delta: (d.dimensionId !== null && d.dimensionId !== undefined && domainDeltas[d.dimensionId] !== undefined) ? domainDeltas[d.dimensionId].delta : 0
        })),
        difficulty: normalizedDifficulties.map(d => ({
          level: d.difficulty ?? null,
          avgAccuracy: Math.round(Number(d.avgAccuracy ?? 0))
        })),
        passFailTrends: {
          pass: Number(passFailData.find((p: PassFailItem) => p.isPass === true)?.count ?? 0),
          fail: Number(passFailData.find((p: PassFailItem) => p.isPass === false)?.count ?? 0)
        },
        efficiency,
        summary: {
            ...trendSummary,
            healthStatus
        }
      };
    } catch (_error) {
      const efficiency = {
        mastery: 0,
        persistence: 0,
        rash: 0,
        struggle: 0,
        noData: 0,
        total: 0
      };
      const summary = {
        avgScore: 0,
        passRate: 0,
        totalExams: 0,
        bestSkill: null,
        worstSkill: null,
        currentStreak: 0,
        healthStatus: TrendsService.getExecHealth(0, 0)
      };
      return {
        domains: [],
        difficulty: [],
        passFailTrends: { pass: 0, fail: 0 },
        efficiency,
        summary
      };
    }
  }

  async getRecentAuditLogs(cursor: string | null = null, limit: number = 20) {
    const result = await this.repository.getAuditLogs(cursor, limit);
    return {
        logs: result.data,
        nextCursor: result.nextCursor
    };
  }

  async getBlueprintMetrics() { return { total: 0, active: 0, popular: [] }; }

  async getContentHealthReport() {
    const allDomains = (await this.repository.getAllDomainHierarchy()) as DomainNode[];

    const calculateStats = (qs: QuestionNode[]) => {
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
      const domainQuestions: QuestionNode[] = [];
      const subjectsResults = domain.subjects.map((subject) => {
        const subjectQuestions: QuestionNode[] = [];
        const topicsResults = subject.topics.map((topic) => {
          subjectQuestions.push(...topic.questions.map((q) => ({ difficulty: q.difficulty, subtopicId: q.subtopicId })));
          return {
            id: topic.id,
            name: topic.name,
            stats: calculateStats(topic.questions.map((q) => ({ difficulty: q.difficulty, subtopicId: q.subtopicId }))),
            subtopics: topic.subtopics.map((st) => ({
              id: st.id,
              name: st.name,
              stats: calculateStats(topic.questions.filter((q) => q.subtopicId === st.id).map((q) => ({ difficulty: q.difficulty, subtopicId: q.subtopicId })))
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
