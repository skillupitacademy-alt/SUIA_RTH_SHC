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
   * Aggregates dashboard data for a user.
   */
  static async getUserDashboard(userId: string, range: string = '7d', from?: string, to?: string) {
    let days = range === '30d' ? 30 : 7;
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

    const recentCompletedExams = await db.query.exams.findMany({
      where: baseFilter,
      orderBy: [desc(exams.completedAt)],
      limit: 4,
      with: {
        blueprint: true,
      }
    });

    const performanceTrendResult = await db
      .select({
        score: exams.totalScore,
        completedAt: exams.completedAt,
      })
      .from(exams)
      .where(trendFilter)
      .orderBy(exams.completedAt); // Chronological ascending for chart

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
        globalRank: null, // Placeholder for Global Rank
      },
      performanceTrend: performanceTrendResult.map(t => ({
        score: t.score || 0,
        date: t.completedAt ? t.completedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Unknown'
      })),
      recentActivity: recentCompletedExams.map(e => ({
        id: e.id,
        title: e.blueprint?.name || 'Quick Quiz',
        score: e.totalScore,
        relativeTime: this.getRelativeTime(e.completedAt!),
        status: e.status,
      })),
    };
  }
}
