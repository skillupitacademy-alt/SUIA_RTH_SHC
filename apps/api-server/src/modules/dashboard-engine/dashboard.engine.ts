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
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    return date.toLocaleDateString();
  }

  /**
   * Aggregates dashboard data for a user.
   */
  static async getUserDashboard(userId: string) {
    const recentExams = await db.query.exams.findMany({
      where: eq(exams.userId, userId),
      orderBy: [desc(exams.startedAt)],
      limit: 4,
      with: {
        blueprint: true,
      }
    });

    const performanceTrend = await db
      .select({
        score: exams.totalScore,
      })
      .from(exams)
      .where(and(eq(exams.userId, userId), eq(exams.status, 'completed')))
      .orderBy(desc(exams.completedAt))
      .limit(7);

    const statsResult = await db
      .select({
        avgScore: sql<number>`avg(total_score)`.mapWith(Number),
        totalExams: sql<number>`count(*)`.mapWith(Number),
      })
      .from(exams)
      .where(and(eq(exams.userId, userId), eq(exams.status, 'completed')));

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
      },
      performanceTrend: performanceTrend.map(t => t.score || 0).reverse(),
      recentActivity: recentExams.map(e => ({
        id: e.id,
        title: e.blueprint?.name || 'Quick Quiz',
        score: e.status === 'completed' ? e.totalScore : null,
        relativeTime: this.getRelativeTime(e.startedAt),
        status: e.status,
      })),
    };
  }
}
