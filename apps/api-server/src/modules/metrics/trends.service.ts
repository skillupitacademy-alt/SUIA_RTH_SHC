import { db, exams, resultsByDimension } from '@quiz/db';
import { eq, desc, gte, and, sql } from 'drizzle-orm';

export interface ScoreTrend {
  examId: string;
  date: Date;
  score: number;
  passed: boolean;
  blueprintName: string | null;
}

export interface SkillTrend {
  skillId: string;
  skillName: string;
  currentScore: number;
  previousScore: number | null;
  delta: number;
  trend: 'improving' | 'declining' | 'stable';
  sparkline: number[];
}

export interface TrendSummary {
  avgScore: number;
  passRate: number;
  totalExams: number;
  bestSkill: { name: string; delta: number } | null;
  worstSkill: { name: string; delta: number } | null;
  currentStreak: number;
}

export class TrendsService {
  private static PASS_THRESHOLD = parseInt(process.env.PASS_THRESHOLD || '70', 10);
  private static MAX_EXAMS = 200;
  private static MAX_SKILLS = 20;

  /**
   * Get score progression over time
   */
  static async getScoreTrends(params: { userId?: string; range?: string }): Promise<ScoreTrend[]> {
    const { userId, range = '7d' } = params;
    const daysAgo = this.parseDaysFromRange(range);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const conditions = [
      eq(exams.status, 'completed'),
      gte(exams.completedAt, cutoffDate)
    ];

    if (userId) {
      conditions.push(eq(exams.userId, userId));
    }

    const userExams = await db.query.exams.findMany({
      where: and(...conditions),
      orderBy: [desc(exams.completedAt)],
      limit: this.MAX_EXAMS,
      with: {
        blueprint: {
          columns: {
            name: true
          }
        }
      }
    });

    return userExams.map(exam => ({
      examId: exam.id,
      date: exam.completedAt!,
      score: exam.totalScore || 0,
      passed: (exam.totalScore || 0) >= this.PASS_THRESHOLD,
      blueprintName: exam.blueprint?.name || null
    })).reverse(); // Oldest first for chart display
  }

  /**
   * Get skill improvement deltas
   */
  static async getSkillTrends(params: { userId?: string; range?: string }): Promise<SkillTrend[]> {
    const { userId, range = '7d' } = params;
    const daysAgo = this.parseDaysFromRange(range);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    // Get all exams in range
    const conditions = [
      eq(exams.status, 'completed'),
      gte(exams.completedAt, cutoffDate)
    ];

    if (userId) {
      conditions.push(eq(exams.userId, userId));
    }

    const userExams = await db.query.exams.findMany({
      where: and(...conditions),
      orderBy: [desc(exams.completedAt)],
      limit: this.MAX_EXAMS,
      columns: {
        id: true,
        completedAt: true
      }
    });

    if (userExams.length === 0) return [];

    const examIds = userExams.map(e => e.id);

    // Get skill results for these exams
    const skillResults = await db.query.resultsByDimension.findMany({
      where: and(
        sql`${resultsByDimension.examId} = ANY(${examIds})`,
        eq(resultsByDimension.dimensionType, 'skill')
      ),
      orderBy: [desc(resultsByDimension.examId)]
    });

    // Group by skill and calculate deltas
    const skillMap = new Map<string, { name: string; scores: number[]; examDates: Date[] }>();

    for (const result of skillResults) {
      const skillId = result.dimensionId || result.name;
      if (!skillId) continue; // Skip if no valid ID
      
      if (!skillMap.has(skillId)) {
        skillMap.set(skillId, {
          name: result.name || 'Unknown Skill',
          scores: [],
          examDates: []
        });
      }
      const examDate = userExams.find(e => e.id === result.examId)?.completedAt;
      if (examDate) {
        skillMap.get(skillId)!.scores.push(result.accuracy);
        skillMap.get(skillId)!.examDates.push(examDate);
      }
    }

    // Calculate trends
    const trends: SkillTrend[] = [];

    for (const [skillId, data] of skillMap.entries()) {
      if (data.scores.length === 0) continue;

      const currentScore = data.scores[0]; // Most recent
      const previousScore = data.scores.length > 1 ? data.scores[1] : null;
      const delta = previousScore !== null ? currentScore - previousScore : 0;

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (delta > 5) trend = 'improving';
      else if (delta < -5) trend = 'declining';

      trends.push({
        skillId,
        skillName: data.name,
        currentScore,
        previousScore,
        delta,
        trend,
        sparkline: data.scores.slice(0, 5).reverse() // Last 5 scores, oldest first
      });
    }

    // Sort by absolute delta (biggest changes first) and limit
    return trends
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, this.MAX_SKILLS);
  }

  /**
   * Get aggregate summary stats
   */
  static async getTrendSummary(params: { range?: string }): Promise<TrendSummary> {
    const { range = '7d' } = params;
    const daysAgo = this.parseDaysFromRange(range);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const userExams = await db.query.exams.findMany({
      where: and(
        eq(exams.status, 'completed'),
        gte(exams.completedAt, cutoffDate)
      ),
      orderBy: [desc(exams.completedAt)],
      limit: this.MAX_EXAMS
    });

    if (userExams.length === 0) {
      return {
        avgScore: 0,
        passRate: 0,
        totalExams: 0,
        bestSkill: null,
        worstSkill: null,
        currentStreak: 0
      };
    }

    // Calculate avg score and pass rate
    const totalScore = userExams.reduce((sum, exam) => sum + (exam.totalScore || 0), 0);
    const avgScore = Math.round(totalScore / userExams.length);
    const passedCount = userExams.filter(exam => (exam.totalScore || 0) >= this.PASS_THRESHOLD).length;
    const passRate = passedCount / userExams.length;

    // Calculate current streak (consecutive passes from most recent)
    let currentStreak = 0;
    for (const exam of userExams) {
      if ((exam.totalScore || 0) >= this.PASS_THRESHOLD) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Get skill trends for best/worst
    const skillTrends = await this.getSkillTrends({ range });
    const bestSkill = skillTrends.length > 0 && skillTrends[0].delta > 0
      ? { name: skillTrends[0].skillName, delta: skillTrends[0].delta }
      : null;
    
    const worstSkill = skillTrends.find(s => s.delta < 0)
      ? { name: skillTrends.find(s => s.delta < 0)!.skillName, delta: skillTrends.find(s => s.delta < 0)!.delta }
      : null;

    return {
      avgScore,
      passRate,
      totalExams: userExams.length,
      bestSkill,
      worstSkill,
      currentStreak
    };
  }

  /**
   * Parse range string to days
   */
  private static parseDaysFromRange(range: string): number {
    const match = range.match(/^(\d+)d$/);
    if (!match) return 7; 
    const days = parseInt(match[1], 10);
    const validDays = [7, 14, 28, 90];
    if (!validDays.includes(days)) return 7;
    return days;
  }
}
