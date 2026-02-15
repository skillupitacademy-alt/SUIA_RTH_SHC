import { auditLogs, db, domains, examQuestions,exams, questions, resultsByDimension, subjects, subtopics, topics, users } from '@quiz/db';
import { count, desc, eq, isNotNull,sql } from 'drizzle-orm';

import { TrendsService } from '@/modules/metrics/trends.service';

export interface ExamActivityReport {
  started: number;
  completed: number;
  abandoned: number;
  byDomain: { name: string | null; count: number }[];
  avgCompletionTimeMinutes: number;
}

export class AdminAnalyticsEngine {
  static async getPlatformMetrics() {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [examCount] = await db.select({ count: count() }).from(exams);
    const [domainCount] = await db.select({ count: count() }).from(domains);

    return {
      totalUsers: userCount.count,
      totalExams: examCount.count,
      totalDomains: domainCount.count,
      activeUsers24h: 0 
    };
  }

  static async getExamActivity(): Promise<ExamActivityReport> {
    const statusStats = await db.select({
      status: exams.status,
      count: sql`count(*)`,
    })
    .from(exams)
    .groupBy(exams.status);

    const domainActivity = await db.select({
      domainName: resultsByDimension.name,
      count: sql`count(distinct ${resultsByDimension.examId})`,
    })
    .from(resultsByDimension)
    .where(eq(resultsByDimension.dimensionType, 'domain'))
    .groupBy(resultsByDimension.name);

    const [avgTimeResult] = await db.select({
      avgTime: sql`avg(extract(epoch from (${exams.completedAt} - ${exams.startedAt})))`
    })
    .from(exams)
    .where(eq(exams.status, 'completed'));

    const base = statusStats.reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = Number(curr.count ?? 0);
      return acc;
    }, { started: 0, completed: 0, abandoned: 0 });

    return {
      ...base,
      byDomain: domainActivity.map(d => ({ name: d.domainName, count: Number(d.count ?? 0) })),
      avgCompletionTimeMinutes: Math.round(Number(avgTimeResult?.avgTime ?? 0) / 60)
    } as ExamActivityReport;
  }

  static async getEfficiencyAnalytics() {
    const TIME_THRESHOLD = 60;
    
    const counts = await db.select({
      quadrant: sql<string>`
        case 
          when ${examQuestions.isCorrect} = true 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) <= ${TIME_THRESHOLD} 
               then 'mastery'
          when ${examQuestions.isCorrect} = true 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) > ${TIME_THRESHOLD} 
               then 'persistence'
          when ${examQuestions.isCorrect} = false 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) <= ${TIME_THRESHOLD} 
               then 'rash'
          when ${examQuestions.isCorrect} = false 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) > ${TIME_THRESHOLD} 
               then 'struggle'
          else 'no_data'
        end
      `,
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(examQuestions)
    .where(isNotNull(examQuestions.isCorrect))
    .groupBy(sql`
        case 
          when ${examQuestions.isCorrect} = true 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) <= ${TIME_THRESHOLD} 
               then 'mastery'
          when ${examQuestions.isCorrect} = true 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) > ${TIME_THRESHOLD} 
               then 'persistence'
          when ${examQuestions.isCorrect} = false 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) <= ${TIME_THRESHOLD} 
               then 'rash'
          when ${examQuestions.isCorrect} = false 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) > ${TIME_THRESHOLD} 
               then 'struggle'
          else 'no_data'
        end
    `);

    return {
      mastery: counts.find(c => c.quadrant === 'mastery')?.count ?? 0,
      persistence: counts.find(c => c.quadrant === 'persistence')?.count ?? 0,
      rash: counts.find(c => c.quadrant === 'rash')?.count ?? 0,
      struggle: counts.find(c => c.quadrant === 'struggle')?.count ?? 0,
      noData: counts.find(c => c.quadrant === 'no_data')?.count ?? 0,
      total: counts.reduce((acc, curr) => acc + curr.count, 0)
    };
  }

  static async getPerformanceAnalytics(range: string = '7d') {
    const [
        domainScores,
        difficultyScores,
        passFail,
        efficiencyResult,
        trendSummaryResult,
        deltaDataResult,
        domainDeltasResult
    ] = await Promise.allSettled([
        db.select({
            dimensionId: resultsByDimension.dimensionId,
            name: resultsByDimension.name,
            avgAccuracy: sql`avg(${resultsByDimension.accuracy})`,
            count: sql`count(*)`,
        })
        .from(resultsByDimension)
        .where(eq(resultsByDimension.dimensionType, 'domain'))
        .groupBy(resultsByDimension.dimensionId, resultsByDimension.name),

        db.select({
            difficulty: resultsByDimension.name,
            avgAccuracy: sql`avg(${resultsByDimension.accuracy})`,
        })
        .from(resultsByDimension)
        .where(eq(resultsByDimension.dimensionType, 'difficulty'))
        .groupBy(resultsByDimension.name),

        db.select({
            isPass: sql`case when ${resultsByDimension.accuracy} >= 70 then true else false end`.mapWith(Boolean),
            count: sql`count(*)`.mapWith(Number),
        })
        .from(resultsByDimension)
        .where(eq(resultsByDimension.dimensionType, 'domain'))
        .groupBy(sql`case when ${resultsByDimension.accuracy} >= 70 then true else false end`),

        this.getEfficiencyAnalytics(),

        TrendsService.getTrendSummary({ range }),
        TrendsService.getPeriodDelta(undefined, range),
        TrendsService.getDomainDeltas(range)
    ]);

    const domainsData = domainScores.status === 'fulfilled' ? domainScores.value : [];
    const difficulties = difficultyScores.status === 'fulfilled' ? difficultyScores.value : [];
    interface PassFailItem { isPass: boolean; count: number; }
    const passFailData: PassFailItem[] = passFail.status === 'fulfilled' ? (passFail.value as PassFailItem[]) : [];
    
    const efficiency = efficiencyResult.status === 'fulfilled' ? efficiencyResult.value : {
        mastery: 0, persistence: 0, rash: 0, struggle: 0, noData: 0, total: 0
    };

    const trendSummary = trendSummaryResult.status === 'fulfilled' ? trendSummaryResult.value : {
        avgScore: 0, passRate: 0, totalExams: 0, bestSkill: null, worstSkill: null, currentStreak: 0
    };

    const deltaData = deltaDataResult.status === 'fulfilled' ? deltaDataResult.value : null;
    const domainDeltas = domainDeltasResult.status === 'fulfilled' ? domainDeltasResult.value : {};
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
      efficiency,
      summary: {
          ...trendSummary,
          deltaPct: deltaData?.deltaPct ?? null,
          healthStatus
      }
    };
  }

  static async getRecentAuditLogs(limit: number = 20) {
    return await db.query.auditLogs.findMany({
      limit,
      orderBy: [desc(auditLogs.createdAt)],
      with: {
          user: true
      }
    });
  }

  static async getBlueprintMetrics() { return { total: 0, active: 0, popular: [] }; }
  static async getContentHealthReport() {
    const allDomains = await db.query.domains.findMany({
      with: {
        subjects: {
          with: {
            topics: {
              with: {
                subtopics: true,
                questions: {
                   where: eq(questions.status, 'active')
                },
              }
            }
          }
        }
      }
    });

    const calculateStats = (qs: any[]) => {
      const stats = {
        total: qs.length,
        simple: qs.filter(q => q.difficulty === 'simple').length,
        intermediate: qs.filter(q => q.difficulty === 'intermediate').length,
        expert: qs.filter(q => q.difficulty === 'expert').length,
        isReady: qs.length >= 10 // Threshold for readiness
      };
      return stats;
    };

    return allDomains.map(domain => {
      const domainQuestions: any[] = [];
      const subjects = domain.subjects.map(subject => {
        const subjectQuestions: any[] = [];
        const topics = subject.topics.map(topic => {
          subjectQuestions.push(...topic.questions);
          return {
            id: topic.id,
            name: topic.name,
            stats: calculateStats(topic.questions),
            subtopics: topic.subtopics.map(st => ({
              id: st.id,
              name: st.name,
              stats: calculateStats(topic.questions.filter(q => q.subtopicId === st.id))
            }))
          };
        });
        domainQuestions.push(...subjectQuestions);
        return {
          id: subject.id,
          name: subject.name,
          stats: calculateStats(subjectQuestions),
          topics
        };
      });

      return {
        domainId: domain.id,
        domainName: domain.name,
        stats: calculateStats(domainQuestions),
        subjects
      };
    });
  }
  static async getGrowthZones() { return { areas: [] }; }
  static async getRBACMetrics() { return { roles: [], permissions: [] }; }
  static async getSecuritySignals() { return { threats: [], status: 'nominal' }; }
  static async getAccountMetrics() { return { active: 0, new: 0, churn: 0 }; }
  static async getLiveSessions() { return { active: 0, peak24h: 0 }; }
}
