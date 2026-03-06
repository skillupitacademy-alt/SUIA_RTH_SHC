import { db, exams, resultsByDimension } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withSpan } from '@/lib/tracer';
import { container } from '@/modules/core/container';
import { eventBus } from '@/modules/core/event-bus';

import { ExamObserver } from '../exam-engine/exam.observer';
import { ExamStateMachine } from '../exam-engine/exam.state-machine';
import { ExamRepository } from '../exam-engine/repositories/exam.repository';
import { PerformanceService } from '../report-engine/performance.service';
import { ReportEngine } from '../report-engine/report.engine';
import { DimensionRegistry } from './calculators/dimension.registry';
import type { EvaluatedAnswer } from './strategies/scoring-strategy.interface';
import { ScoringStrategyRegistry } from './strategies/scoring-strategy.registry';

export const dynamic = 'force-dynamic';

export class ScoringEngine {
  private static singleton: ScoringEngine | null = null;
  private log = logger.child({ module: 'scoring-engine' });
  private static observerInitialized = false;

  constructor(
    private readonly performanceService = container.get(PerformanceService),
    private readonly examRepo = container.get(ExamRepository),
    private readonly reportEngine = container.get(ReportEngine)
  ) {
    if (!ScoringEngine.observerInitialized) {
        ExamObserver.init();
        ScoringEngine.observerInitialized = true;
    }
  }

  private static getInstance() {
    if (this.singleton === null) this.singleton = new ScoringEngine();
    return this.singleton;
  }

  async calculateExamResults(examId: string) {
    return withSpan('ScoringEngine.calculateExamResults', async (span) => {
      const start = Date.now();
      span.setAttribute('examId', examId);
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

        const evaluatedAnswers: EvaluatedAnswer[] = exam.examQuestions.map(eq => ({
          question: eq.question,
          examQuestion: {
              ...eq,
              isCorrect: eq.isCorrect
          }
        }));

        const strategyName = typeof (exam.blueprint as { scoringStrategy?: string })?.scoringStrategy === 'string'
          ? (exam.blueprint as { scoringStrategy?: string }).scoringStrategy!
          : 'percentage';
        const strategy = ScoringStrategyRegistry.get(strategyName);
        
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

        const resultsData = strategy.calculateDimensionScores(evaluatedAnswers, dimensions).map(ds => ({
          examId,
          dimensionType: ds.type,
          dimensionId: ds.id,
          name: ds.name,
          score: ds.score,
          accuracy: ds.accuracy,
        }));

        await db.delete(resultsByDimension).where(eq(resultsByDimension.examId, examId));

        if (resultsData.length > 0) {
          await db.insert(resultsByDimension).values(resultsData);
        }

        const finalScore = strategy.calculateOverallScore(evaluatedAnswers);

        // Transition Status
        await ExamStateMachine.transition(examId, 'completed');

        // Update Score & Completion Metadata
        await db.update(exams)
          .set({ 
            totalScore: finalScore, 
            completedAt: new Date()
          })
          .where(eq(exams.id, examId));

        // Task 62: Emit event instead of direct orchestration
        eventBus.emit('EXAM_COMPLETED', {
            examId,
            userId: exam.userId,
            score: finalScore
        });

        const durationMs = Date.now() - start;
        recordCounter(METRICS.CORE.SCORING + '.success', 1);
        recordTimer(METRICS.CORE.SCORING + '.duration', durationMs);

        return finalScore;
      } catch (_error) {
        const durationMs = Date.now() - start;
        recordCounter(METRICS.CORE.SCORING + '.failure', 1, { error: _error instanceof Error ? _error.message : 'unknown' });
        recordTimer(METRICS.CORE.SCORING + '.duration', durationMs);

        this.log.error({ examId, error: _error instanceof Error ? _error.message : 'unknown error' }, 'Scoring failed');
        
        await db.update(exams)
          .set({ status: 'failed' })
          .where(eq(exams.id, examId))
          .catch(() => null);

        await ExamStateMachine.transition(examId, 'failed').catch(() => null);
        
        eventBus.emit('EXAM_FAILED', {
            examId,
            userId: 'unknown',
            error: _error instanceof Error ? _error.message : 'unknown error'
        });
        
        throw _error;
      }
    });
  }

  static calculateExamResults(examId: string) {
    return this.getInstance().calculateExamResults(examId);
  }

  static setInstance(mock: ScoringEngine) {
    this.singleton = mock;
  }
}
