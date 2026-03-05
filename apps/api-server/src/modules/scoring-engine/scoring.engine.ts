import { db, exams, resultsByDimension } from '@quiz/db';
import { eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { container } from '@/modules/core/container';

import { PerformanceService } from '../report-engine/performance.service';
import { ReportEngine } from '../report-engine/report.engine';
import { DimensionRegistry } from './calculators/dimension.registry';

export const dynamic = 'force-dynamic';

export class ScoringEngine {
  private static log = logger.child({ module: 'scoring-engine' });

  static async calculateExamResults(examId: string) {
    // Phase 1: Invalidate existing cache before re-computing
    await container.get(PerformanceService).invalidateCache(examId);

    try {
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        with: {
          examQuestions: {
            with: {
              question: {
                with: {
                  questionSkills: {
                    with: {
                      skill: true
                    }
                  }
                }
              },
            }
          }
        }
      });

      if (exam === undefined) throw new Error('Exam not found');

      const dimensions: Record<string, { total: number; correct: number; name?: string }> = {};

      // 1. Resolve Hierarchy Data
      const topicIds = [...new Set(exam.examQuestions.map(eq => eq.question.topicId))];
      const topicData = await db.query.topics.findMany({
        where: (topics, { inArray }) => inArray(topics.id, topicIds as string[]),
        with: {
          subject: {
            with: {
              domain: true
            }
          },
          topicSkills: {
            with: {
              skill: true
            }
          },
          subtopics: true
        }
      });

      const topicMap = new Map(topicData.map(t => [t.id, t]));

      // 2. Analyze performance by various dimensions
      for (const eqRecord of exam.examQuestions) {
        const q = eqRecord.question;
        const t = topicMap.get(q.topicId);
        if (t === undefined) continue;

        const baseDims = DimensionRegistry.getAllDimensions({
            question: q,
            topic: t,
            examQuestion: eqRecord
        });

        for (const d of baseDims) {
          const key = `${d.type}:${d.id}`;
          if (dimensions[key] === undefined) dimensions[key] = { total: 0, correct: 0, name: d.name };
          dimensions[key].total += d.weight;
          if (eqRecord.isCorrect === true) dimensions[key].correct += d.weight;
        }
      }

      // 3. Prepare data for results_by_dimension
      const resultsData = Object.entries(dimensions).map(([key, stats]) => {
        const parts = key.split(':');
        const type = parts[0];
        const id = parts.slice(1).join(':');

        const accuracyValue = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        
        return {
          examId,
          dimensionType: type,
          dimensionId: id as string,
          name: stats.name,
          score: accuracyValue,
          accuracy: accuracyValue,
        };
      });

      // Clear old results if any (idempotency)
      await db.delete(resultsByDimension).where(eq(resultsByDimension.examId, examId));

      if (resultsData.length > 0) {
        await db.insert(resultsByDimension).values(resultsData);
      }

      // 4. Update total score and finalize exam
      const totalQuestions = exam.examQuestions.length;
      let finalScore = 0;
      
      if (totalQuestions > 0) {
        const totalCorrect = exam.examQuestions.filter(q => q.isCorrect === true).length;
        finalScore = Math.round((totalCorrect / totalQuestions) * 100);
      }

      await db.update(exams)
        .set({ 
          totalScore: finalScore, 
          completedAt: new Date(), 
          status: 'completed' 
        })
        .where(eq(exams.id, examId));

      // Phase 1: Refresh Materialized Views and Prime Cache (Non-blocking but awaited for consistency here)
      try {
        await container.get(PerformanceService).refreshAnalytics();

        // Hierarchical Materialization (Phase 1 of Roadmap)
        const { ReportMaterializer } = await import('../../services/reports/ReportMaterializer');
        await ReportMaterializer.materialize(examId);
        const reportData = await ReportEngine.getPremiumExamReport(examId);
        await container.get(PerformanceService).cacheReport(examId, reportData);
        ScoringEngine.log.info({ examId }, 'Phase 1: Analytics refreshed and cache primed');

        // Trigger PDF Generation (Background)
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';
        fetch(`${apiBase}/generate-report`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_API_KEY ?? 'secret'
          },
          body: JSON.stringify({ attemptId: examId })
        }).catch(err => ScoringEngine.log.error({ examId, err }, 'Failed to trigger background PDF generation'));
      } catch (e) {
        ScoringEngine.log.error({ examId, err: e }, 'Phase 1: Failed to refresh analytics or prime cache');
      }

      return finalScore;
    } catch (_error) {
      ScoringEngine.log.error(
        { examId, error: _error instanceof Error ? _error.message : 'unknown error' },
        'Failed to calculate results for exam',
      );
      await db.update(exams)
        .set({ status: 'failed' })
        .where(eq(exams.id, examId))
        .catch(err => {
          ScoringEngine.log.error(
            { examId, error: err instanceof Error ? err.message : 'unknown error' },
            'Failed to mark exam as failed after scoring error',
          );
        });
      throw _error;
    }
  }
}
