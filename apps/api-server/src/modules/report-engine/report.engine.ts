import { db, exams, resultsByDimension } from '@quiz/db';
import { eq, desc } from 'drizzle-orm';

export class ReportService {
  static async getUserPerformance(userId: string) {
    const userExams = await db.query.exams.findMany({
      where: eq(exams.userId, userId),
      orderBy: [desc(exams.completedAt)],
      with: {
        dimensions: true,
      }
    });

    // Aggregate strength and weak areas
    const topicStats: Record<string, { totalScore: number; count: number }> = {};
    
    for (const exam of userExams) {
      for (const dim of exam.dimensions) {
        if (dim.dimensionType === 'topic') {
          const id = dim.dimensionId!;
          if (!topicStats[id]) topicStats[id] = { totalScore: 0, count: 0 };
          topicStats[id].totalScore += dim.score;
          topicStats[id].count++;
        }
      }
    }

    const masters = Object.entries(topicStats)
      .map(([id, stats]) => ({ id, average: stats.totalScore / stats.count }))
      .sort((a, b) => b.average - a.average);

    return {
      examsCompleted: userExams.length,
      averageScore: userExams.length > 0 ? userExams.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / userExams.length : 0,
      strengthAreas: masters.slice(0, 3),
      weakAreas: masters.slice(-3),
    };
  }
}
