import { db, exams, resultsByDimension } from '@quiz/db';
import { eq, desc, sql, and } from 'drizzle-orm';

export class DashboardEngine {
  private static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    // Transition to absolute date for > 7 days as per contract
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
  }

  /**
   * Aggregates dashboard data for a user with pagination support.
   */
  static async getUserDashboard(userId: string, range: string = '7d', from?: string, to?: string, page: number = 1, limit: number = 6) {
    let days = 7;
    if (range === '14d') days = 14;
    else if (range === '28d') days = 28;
    else if (range === '90d') days = 90; // Stub for future use
    const now = new Date();
    const relativeStartDate = new Date();
    relativeStartDate.setDate(now.getDate() - days);
    relativeStartDate.setHours(0, 0, 0, 0);

    let baseFilter = and(eq(exams.userId, userId), eq(exams.status, 'completed'));
    let trendFilter = and(baseFilter, sql`${exams.completedAt} >= ${relativeStartDate}`);

    if (from && to) {
        trendFilter = and(baseFilter, sql`${exams.completedAt} BETWEEN ${new Date(from)} AND ${new Date(to)}`);
    }

    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start of week

    // 1. Get Total Count for Pagination
    const totalCountResult = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(exams)
        .where(baseFilter);
    const totalCount = totalCountResult[0]?.count || 0;

    // 2. Fetch Paginated Exams
    const offset = (page - 1) * limit;
    const recentCompletedExams = await db.query.exams.findMany({
      where: baseFilter,
      orderBy: [desc(exams.completedAt)],
      limit: limit,
      offset: offset,
      with: {
        blueprint: true,
        dimensions: true, 
      }
    });

    const performanceTrendResult = await db
      .select({
        score: exams.totalScore,
        completedAt: exams.completedAt,
      })
      .from(exams)
      .where(trendFilter)
      .orderBy(exams.completedAt); 

    const statsResult = await db
      .select({
        avgScore: sql<number>`avg(total_score)`.mapWith(Number),
        totalExams: sql<number>`count(*)`.mapWith(Number),
      })
      .from(exams)
      .where(baseFilter);

    const weeklyExamsResult = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(exams)
      .where(and(
        baseFilter,
        sql`${exams.completedAt} >= ${startOfWeek}`
      ));

    const masteryResult = await db
      .select({
        totalPoints: sql<number>`sum(score)`.mapWith(Number),
      })
      .from(resultsByDimension)
      .innerJoin(exams, eq(resultsByDimension.examId, exams.id))
      .where(eq(exams.userId, userId));

    return {
      overview: {
        avgScore: statsResult[0]?.avgScore || 0,
        totalExams: statsResult[0]?.totalExams || 0,
        masteryPoints: masteryResult[0]?.totalPoints || 0,
        weeklyExamsCount: weeklyExamsResult[0]?.count || 0,
        globalRank: null, 
      },
      performanceTrend: performanceTrendResult.map(t => ({
        score: t.score || 0,
        date: t.completedAt ? t.completedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Unknown'
      })),
      recentActivity: recentCompletedExams.map(e => {
        // Derive title: Blueprint Name > Dimensions (Topic > Subject > Domain)
        let derivedTitle: string | null | undefined = e.blueprint?.name;
        
        if (!derivedTitle && e.dimensions && e.dimensions.length > 0) {
            const topic = e.dimensions.find(d => d.dimensionType === 'topic');
            const subject = e.dimensions.find(d => d.dimensionType === 'subject');
            const domain = e.dimensions.find(d => d.dimensionType === 'domain');
            
            // Prefer Topic, then Subject, then Domain name if available
            derivedTitle = topic?.name || subject?.name || domain?.name;
        }

        return {
          id: e.id,
          title: derivedTitle ?? 'Self-Paced Quiz',
          score: e.totalScore,
          relativeTime: this.getRelativeTime(e.completedAt!),
          status: e.status,
        };
      }),
      pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Focused trend fetching for decoupled graph updates.
   */
  static async getPerformanceTrend(userId: string, range: string = '7d') {
    let days = 7;
    if (range === '14d') days = 14;
    else if (range === '28d') days = 28;
    else if (range === '90d') days = 90;

    const relativeStartDate = new Date();
    relativeStartDate.setDate(relativeStartDate.getDate() - days);
    relativeStartDate.setHours(0, 0, 0, 0);

    const trendResult = await db
      .select({
        score: exams.totalScore,
        completedAt: exams.completedAt,
      })
      .from(exams)
      .where(and(
        eq(exams.userId, userId),
        eq(exams.status, 'completed'),
        sql`${exams.completedAt} >= ${relativeStartDate}`
      ))
      .orderBy(exams.completedAt);

    return {
      performanceTrend: trendResult.map(t => ({
        score: t.score || 0,
        date: t.completedAt ? t.completedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Unknown'
      }))
    };
  }

  /**
   * Fetches unique domains, subjects and topics attempted by the user for filter populating.
   */
  static async getDrilldownMetadata(userId: string) {
    const dimensions = await db
      .selectDistinct({
        dimensionId: resultsByDimension.dimensionId,
        dimensionType: resultsByDimension.dimensionType,
        name: resultsByDimension.name,
      })
      .from(resultsByDimension)
      .innerJoin(exams, eq(resultsByDimension.examId, exams.id))
      .where(and(
        eq(exams.userId, userId),
        eq(exams.status, 'completed'),
        sql`${resultsByDimension.dimensionType} IN ('domain', 'subject', 'topic')`
      ));

    return {
      domains: dimensions.filter(d => d.dimensionType === 'domain'),
      subjects: dimensions.filter(d => d.dimensionType === 'subject'),
      topics: dimensions.filter(d => d.dimensionType === 'topic'),
    };
  }

  /**
   * Aggregates attempt volume/scores by dimension for stacked breakdowns.
   */
  static async getDrilldownAnalytics(userId: string, range: string = '28d') {
    let days = 28;
    if (range === '7d') days = 7;
    else if (range === '14d') days = 14;
    else if (range === '90d') days = 90;

    const relativeStartDate = new Date();
    relativeStartDate.setDate(relativeStartDate.getDate() - days);

    const results = await db
      .select({
        dimensionName: resultsByDimension.name,
        dimensionType: resultsByDimension.dimensionType,
        completedAt: exams.completedAt,
        score: resultsByDimension.score,
      })
      .from(resultsByDimension)
      .innerJoin(exams, eq(resultsByDimension.examId, exams.id))
      .where(and(
        eq(exams.userId, userId),
        eq(exams.status, 'completed'),
        sql`${exams.completedAt} >= ${relativeStartDate}`,
        sql`${resultsByDimension.dimensionType} IN ('domain', 'subject')`
      ));

    // Simple grouping by dimension for stacked bars
    const breakdown: Record<string, { count: number; totalScore: number }> = {};
    results.forEach(r => {
      const key = r.dimensionName || 'Unknown';
      if (!breakdown[key]) breakdown[key] = { count: 0, totalScore: 0 };
      breakdown[key].count++;
      breakdown[key].totalScore += r.score;
    });

    return {
        breakdown: Object.entries(breakdown).map(([name, stats]) => ({
            name,
            count: stats.count,
            avgScore: Math.round(stats.totalScore / stats.count)
        }))
    };
  }
}
