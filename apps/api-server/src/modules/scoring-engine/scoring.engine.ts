import { db, exams, resultsByDimension } from '@quiz/db';
import { eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { container } from '@/modules/core/container';

import { PerformanceService } from '../report-engine/performance.service';
import { ReportEngine } from '../report-engine/report.engine';
import { DimensionRegistry } from './calculators/dimension.registry';
import { ExamRepository } from '../exam-engine/repositories/exam.repository';
import { ScoringStrategyRegistry } from './strategies/scoring-strategy.registry';
import type { EvaluatedAnswer } from './strategies/scoring-strategy.interface';

export const dynamic = 'force-dynamic';

export class ScoringEngine {
  private static singleton = new ScoringEngine();
  private log = logger.child({ module: 'scoring-engine' });

  constructor(
    private readonly performanceService = container.get(PerformanceService),
    private readonly examRepo = container.get(ExamRepository),
    private readonly reportEngine = container.get(ReportEngine)
  ) {}

  async calculateExamResults(examId: string) {
    // Phase 1: Invalidate existing cache before re-computing
    await this.performanceService.invalidateCache(examId);

    try {
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        with: {
          blueprint: true,
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

      // 1. Resolve Hierarchy Data
      const topicIds = [...new Set(exam.examQuestions.map(eq => eq.question.topicId))];
      const topicData = await db.query.topics.findMany({
        where: (topics, { inArray }) => inArray(topics.id, topicIds as string[]),
        with: {
          subject: { with: { domain: true } },
          topicSkills: { with: { skill: true } },
          subtopics: true
        }
      });

      const topicMap = new Map(topicData.map(t => [t.id, t]));

      // 2. Prepare for Strategy
      const evaluatedAnswers: EvaluatedAnswer[] = exam.examQuestions.map(eq => ({
        question: eq.question,
        examQuestion: {
            ...eq,
            isCorrect: eq.isCorrect
        }
      }));

      // Determine strategy
      const strategyName = (exam.blueprint as any)?.scoringStrategy || 'percentage';
      const strategy = ScoringStrategyRegistry.get(strategyName);
      this.log.info({ examId, strategy: strategy.getName() }, 'Applying scoring strategy');

      const dimensions: Record<string, { total: number; correct: number; name?: string }> = {};

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

      // 3. Delegate to Strategy for Scores
      const resultsData = strategy.calculateDimensionScores(evaluatedAnswers, dimensions).map(ds => ({
        examId,
        dimensionType: ds.type,
        dimensionId: ds.id,
        name: ds.name,
        score: ds.score,
        accuracy: ds.accuracy,
      }));

      // Clear old results if any (idempotency)
      await db.delete(resultsByDimension).where(eq(resultsByDimension.examId, examId));

      if (resultsData.length > 0) {
        await db.insert(resultsByDimension).values(resultsData);
      }

      // 4. Update total score using strategy
      const finalScore = strategy.calculateOverallScore(evaluatedAnswers);

      await db.update(exams)
        .set({ 
          totalScore: finalScore, 
          completedAt: new Date(), 
          status: 'completed' 
        })
        .where(eq(exams.id, examId));

      // Phase 1: Refresh Materialized Views and Prime Cache
      try {
        await this.performanceService.refreshAnalytics();

        // Hierarchical Materialization
        const { ReportMaterializer } = await import('../../services/reports/ReportMaterializer');
        await ReportMaterializer.materialize(examId);
        const reportData = await this.reportEngine.getPremiumExamReport(examId);
        await this.performanceService.cacheReport(examId, reportData);
        this.log.info({ examId }, 'Phase 1: Analytics refreshed and cache primed');

        // Trigger PDF Generation (Background)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        fetch(`${apiBase}/generate-report`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_API_KEY || 'secret'
          },
          body: JSON.stringify({ attemptId: examId })
        }).catch(err => this.log.error({ examId, err }, 'Failed to trigger background PDF generation'));
      } catch (e) {
        this.log.error({ examId, err: e }, 'Phase 1: Failed to refresh analytics or prime cache');
      }

      return finalScore;
    } catch (_error) {
      this.log.error(
        { examId, error: _error instanceof Error ? _error.message : 'unknown error' },
        'Failed to calculate results for exam',
      );
      await db.update(exams)
        .set({ status: 'failed' })
        .where(eq(exams.id, examId))
        .catch(err => {
          this.log.error(
            { examId, error: err instanceof Error ? err.message : 'unknown error' },
            'Failed to mark exam as failed after scoring error',
          );
        });
      throw _error;
    }
  }

  // Static facade for legacy tests
  static calculateExamResults(examId: string) {
    return this.singleton.calculateExamResults(examId);
  }
}
