import { db, exams, resultsByDimension } from '@quiz/db';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';

import { ForecastService } from '@/modules/intelligence/forecast.service';

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
  predictedMasteryDate?: string | null;
  isStruggling?: boolean;
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
  private static PASS_THRESHOLD = parseInt(process.env.PASS_THRESHOLD ?? '70', 10);
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

    if (userId !== undefined) {
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
      date: exam.completedAt ?? new Date(),
      score: exam.totalScore ?? 0,
      passed: (exam.totalScore ?? 0) >= this.PASS_THRESHOLD,
      blueprintName: exam.blueprint?.name ?? null
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

    if (userId !== undefined) {
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
      const skillId = result.dimensionId ?? result.name;
      if (skillId === undefined || skillId === null) continue; // Skip if no valid ID
      
      if (!skillMap.has(skillId)) {
        skillMap.set(skillId, {
          name: result.name ?? 'Unknown Skill',
          scores: [],
          examDates: []
        });
      }
      const examDate = userExams.find(e => e.id === result.examId)?.completedAt;
      if (examDate !== undefined && examDate !== null) {
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

      // Prediction Engine Integration
      const forecast = ForecastService.calculateTrajectory(
        data.scores.map((s, idx) => ({ 
          accuracy: s, 
          date: data.examDates[idx] 
        }))
      );

      trends.push({
        skillId,
        skillName: data.name,
        currentScore,
        previousScore,
        delta,
        trend,
        sparkline: data.scores.slice(0, 5).reverse(), // Last 5 scores, oldest first
        predictedMasteryDate: forecast.predictedMasteryDate,
        isStruggling: forecast.isStruggling
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
        gte(exams.completedAt, cutoffDate),
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
    const totalScore = userExams.reduce((sum, exam) => sum + (exam.totalScore ?? 0), 0);
    const avgScore = Math.round(totalScore / userExams.length);
    const passedCount = userExams.filter(exam => (exam.totalScore ?? 0) >= this.PASS_THRESHOLD).length;
    const passRate = passedCount / userExams.length;

    // Calculate current streak (consecutive passes from most recent)
    let currentStreak = 0;
    for (const exam of userExams) {
      if ((exam.totalScore ?? 0) >= this.PASS_THRESHOLD) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Get skill trends for best/worst
    const skillTrends = await this.getSkillTrends({ range });
    const bestSkill = (skillTrends.length > 0 && skillTrends[0].delta > 0)
      ? { name: skillTrends[0].skillName, delta: skillTrends[0].delta }
      : null;
    
    const worstSkillTrend = skillTrends.find(s => s.delta < 0);
    const worstSkill = worstSkillTrend !== undefined
      ? { name: worstSkillTrend.skillName, delta: worstSkillTrend.delta }
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
   * Calculate period-over-period delta (Time Machine)
   */
  static async getPeriodDelta(userId: string | undefined, range: string = '7d'): Promise<{ currentAvg: number | null; previousAvg: number | null; deltaPct: number | null } | null> {
    const days = this.parseDaysFromRange(range);
    
    // Define windows
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000); // The period before that

    // Helper to get average score for a window
    const getWindowAvg = async (start: Date, end: Date) => {
      const conditions = [
        eq(exams.status, 'completed'),
        gte(exams.completedAt, start),
        lt(exams.completedAt, end)
      ];
      if (userId !== undefined) conditions.push(eq(exams.userId, userId));

      const scores = await db.select({ score: exams.totalScore }).from(exams).where(and(...conditions));
      if (scores.length === 0) return { avg: null, count: 0 };

      const total = scores.reduce((acc, curr) => acc + (curr.score ?? 0), 0);
      return { avg: Math.round(total / scores.length), count: scores.length };
    };

    const current = await getWindowAvg(currentStart, now);
    const previous = await getWindowAvg(previousStart, currentStart);

    const totalSamples = (current.count) + (previous.count);
    if (totalSamples < 3) return null; // Not enough data

    return {
      currentAvg: current.avg,
      previousAvg: previous.avg,
      deltaPct: (current.avg !== null && previous.avg !== null) ? current.avg - previous.avg : null
    };
  }

  /**
   * Compute Executive Health Status
   */
  static getExecHealth(currentAvg: number, deltaPct: number | null): 'green' | 'yellow' | 'red' {
    const safeDelta = deltaPct ?? 0;
    
    // Green: High performance OR improving
    if (currentAvg >= 70 && safeDelta >= 0) return 'green';

    // Yellow: Mid performance OR slight dip
    if ((currentAvg >= 50 && currentAvg <= 69) || (safeDelta >= -5 && safeDelta < 0)) return 'yellow';
    
    // Red: Low performance OR major drop
    return 'red';
  }

  /**
   * Get deltas for domains (Period-over-Period)
   */
  static async getDomainDeltas(range: string = '7d'): Promise<Record<string, { current: number; previous: number; delta: number }>> {
    const days = this.parseDaysFromRange(range);
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

    const getPeriodStats = async (start: Date, end: Date) => {
        const stats = await db.select({
            id: resultsByDimension.dimensionId,
            name: resultsByDimension.name,
            score: sql`avg(${resultsByDimension.accuracy})`.mapWith(Number),
            count: sql`count(*)`.mapWith(Number)
        })
        .from(resultsByDimension)
        .innerJoin(exams, eq(resultsByDimension.examId, exams.id))
        .where(and(
            eq(resultsByDimension.dimensionType, 'domain'),
            eq(exams.status, 'completed'),
            gte(exams.completedAt, start),
            lt(exams.completedAt, end)
        ))
        .groupBy(resultsByDimension.dimensionId, resultsByDimension.name);
        
        return stats;
    };

    const [currentStats, previousStats] = await Promise.all([
        getPeriodStats(currentStart, now),
        getPeriodStats(previousStart, currentStart)
    ]);

    const result: Record<string, { current: number; previous: number; delta: number }> = {};

    // Map current stats
    currentStats.forEach(stat => {
        if (stat.id === undefined || stat.id === null) return;
        result[stat.id] = {
            current: Math.round(stat.score),
            previous: 0,
            delta: 0
        };
    });

    // Merge previous stats
    previousStats.forEach(stat => {
        const sid = stat.id;
        if (sid === undefined || sid === null) return;
        if (result[sid] !== undefined) {
            result[sid].previous = Math.round(stat.score);
            result[sid].delta = result[sid].current - result[sid].previous;
        }
    });

    return result;
  }

  /**
   * Parse range string to days
   */
  private static parseDaysFromRange(range: string): number {
    const match = range.match(/^(\d+)d$/);
    if (match === null) return 7; 
    const days = parseInt(match[1], 10);
    const validDays = [7, 14, 28, 90];
    if (!validDays.includes(days)) return 7;
    return days;
  }
}
