import { describe, it, expect, vi } from 'vitest';

vi.mock('@quiz/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@quiz/db')>();

  return {
    ...actual,
    withTimeout: actual.withTimeout ?? (async (promise: Promise<any>) => promise),
    db: {
      ...actual.db,
      query: {
        ...(actual.db as any).query,
        exams: {
          findFirst: vi.fn(),
        },
      },
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: '1' }])),
        })),
      })),
    },
  };
});

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn((token: { name?: string }) => {
      if (token?.name === 'PerformanceService') {
        return {
          refreshAnalytics: vi.fn().mockResolvedValue(undefined),
          cacheReport: vi.fn().mockResolvedValue(undefined),
        };
      }
      if (token?.name === 'ReportEngine') {
        return {
          getPremiumExamReport: vi.fn().mockResolvedValue({}),
        };
      }
      return {};
    }),
  },
}));

vi.mock('../../services/reports/ReportMaterializer', () => ({
  ReportMaterializer: {
    materialize: vi.fn().mockResolvedValue(undefined),
  },
}));

import { MultiSelectEvaluator } from '../../answer-engine/evaluators/multi-select.evaluator';
import { IRTScoringStrategy } from '../../scoring-engine/strategies/irt-scoring.strategy';
import { AppEvents } from '@/lib/events';
import { eventBus } from '@/lib/event-bus';
import { ExamBuilder } from '../exam.builder';
import { ExamObserver } from '../exam.observer';
import { ExamStateMachine } from '../exam.state-machine';
import { AuditLoggingExamRepository } from '../audit-logging.decorator';
import { ExamRepository } from '../repositories/exam.repository';

describe('Sprint 2 Design Patterns Verification', () => {
  describe('Task 59: Enhanced Evaluators (Partial Credit)', () => {
    it('calculates partial score for multi-select questions', () => {
      const evaluator = new MultiSelectEvaluator();

      expect(evaluator.evaluate('A,B,C', 'A,B,C')).toBe(1);
      expect(evaluator.evaluate('A,B,C', 'A,B')).toBeCloseTo(0.66, 1);
      expect(evaluator.evaluate('A,B,C', 'A,D')).toBe(0);
    });
  });

  describe('Task 60: Scoring Strategies (IRT)', () => {
    it('weights score based on question difficulty', () => {
      const strategy = new IRTScoringStrategy();
      const easyScore = strategy.calculateOverallScore([
        { examQuestion: { isCorrect: true }, question: { difficulty: 'simple' } } as any,
        { examQuestion: { isCorrect: false }, question: { difficulty: 'simple' } } as any,
      ]);
      const hardScore = strategy.calculateOverallScore([
        { examQuestion: { isCorrect: true }, question: { difficulty: 'expert' } } as any,
        { examQuestion: { isCorrect: false }, question: { difficulty: 'expert' } } as any,
      ]);

      expect(hardScore).toBeGreaterThan(easyScore);
    });
  });

  describe('Task 61: Exam State Machine', () => {
    it('enforces valid transitions', async () => {
      const { db } = await import('@quiz/db');
      (db.query.exams.findFirst as any).mockResolvedValue({ id: 'e1', status: 'started', userId: 'u1' });

      await expect(ExamStateMachine.transition('e1', 'processing', 'u1')).resolves.not.toThrow();
    });
  });

  describe('Task 62: Observer / Event Bus', () => {
    it('registers EXAM_COMPLETED listener', () => {
      const spy = vi.spyOn(eventBus, 'onEvent');
      ExamObserver.init();
      expect(spy).toHaveBeenCalledWith(AppEvents.EXAM_COMPLETED, expect.any(Function));
    });
  });

  describe('Task 63: Builder Pattern', () => {
    it('constructs exam builder via fluent interface', () => {
      const builder = new ExamBuilder();
      const fluent = builder.forUser('u1').withBlueprint('bp1').withConfig({ questionCount: 10 });

      expect(fluent).toBe(builder);
      expect((builder as any).userId).toBe('u1');
      expect((builder as any).config.questionCount).toBe(10);
    });
  });

  describe('Task 64: Decorator Pattern (Audit Logging)', () => {
    it('wraps repository and delegates updateStatus', async () => {
      const baseRepo = new ExamRepository();
      const auditedRepo = new AuditLoggingExamRepository(baseRepo);
      const delegateSpy = vi.spyOn(baseRepo, 'updateStatus').mockResolvedValue([{ id: 'e1' }] as any);

      await auditedRepo.updateStatus('e1', 'completed');

      expect(delegateSpy).toHaveBeenCalledWith('e1', 'completed');
    });
  });
});

