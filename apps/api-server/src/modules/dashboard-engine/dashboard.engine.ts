import { db, exams, resultsByDimension } from '@quiz/db';
import { eq, desc, sql } from 'drizzle-orm';

export class DashboardEngine {
  /**
   * Aggregates dashboard data for a user.
   */
  static async getUserDashboard(userId: string) {
    const recentExams = await db.query.exams.findMany({
      where: eq(exams.userId, userId),
      orderBy: [desc(exams.completedAt)],
      limit: 5,
      with: {
        blueprint: true,
      }
    });

    const stats = await db
      .select({
        avgScore: sql<number>`avg(total_score)`.mapWith(Number),
        totalExams: sql<number>`count(*)`.mapWith(Number),
      })
      .from(exams)
      .where(eq(exams.userId, userId));

    return {
      overview: stats[0],
      recentActivity: recentExams.map(e => ({
        id: e.id,
        title: e.blueprint?.name || 'Quick Quiz',
        score: e.totalScore,
        date: e.completedAt,
        status: e.status,
      })),
    };
  }
}
