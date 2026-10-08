import { describe, it, expect } from 'vitest';
import { PercentageScoringStrategy } from '../percentage-scoring.strategy';
import { WeightedScoringStrategy } from '../weighted-scoring.strategy';
import { IRTScoringStrategy } from '../irt-scoring.strategy';
import { MasteryScoringStrategy } from '../mastery-scoring.strategy';
import type { EvaluatedAnswer } from '../scoring-strategy.interface';

describe('Scoring Strategies Unit Tests', () => {
  const mockAnswers: EvaluatedAnswer[] = [
    { 
      question: { id: 'q1', difficulty: 'simple' } as any, 
      examQuestion: { isCorrect: true } as any 
    },
    { 
      question: { id: 'q2', difficulty: 'intermediate' } as any, 
      examQuestion: { isCorrect: false } as any 
    },
    { 
      question: { id: 'q3', difficulty: 'expert' } as any, 
      examQuestion: { isCorrect: true } as any 
    }
  ];

  const mockDimensions: Record<string, { total: number; correct: number; name?: string }> = {
    'topic:t1': { total: 10, correct: 5, name: 'Topic 1' }
  };

  describe('PercentageScoringStrategy', () => {
    const strategy = new PercentageScoringStrategy();
    it('calculates 67% for 2/3 correct', () => {
      expect(strategy.calculateOverallScore(mockAnswers)).toBe(67);
    });
    it('returns 0 for no answers', () => {
      expect(strategy.calculateOverallScore([])).toBe(0);
    });

    it('returns zero accuracy for empty dimension totals', () => {
      const dims = strategy.calculateDimensionScores([], {
        'topic:t0': { total: 0, correct: 0, name: 'Zero Topic' },
      });
      expect(dims[0].accuracy).toBe(0);
      expect(dims[0].score).toBe(0);
    });
  });

  describe('WeightedScoringStrategy', () => {
    const strategy = new WeightedScoringStrategy();
    it('calculates weighted score (simple=1, inter=2, expert=3)', () => {
      // Total weight: 1 (q1) + 2 (q2) + 3 (q3) = 6
      // Earned weight: 1 (q1) + 0 (q2) + 3 (q3) = 4
      // 4/6 = 67%
      expect(strategy.calculateOverallScore(mockAnswers)).toBe(67);
    });

    it('uses default weight for unknown difficulty', () => {
      const weirdAnswers: EvaluatedAnswer[] = [
        { question: { id: 'q1', difficulty: null } as any, examQuestion: { isCorrect: true } as any },
      ];
      expect(strategy.calculateOverallScore(weirdAnswers)).toBe(100);
    });

    it('returns zero when weighted dimension total is zero', () => {
      const dims = strategy.calculateDimensionScores([], {
        'skill:s0': { total: 0, correct: 0, name: 'Skill Zero' },
      });
      expect(dims[0].accuracy).toBe(0);
      expect(dims[0].score).toBe(0);
    });
  });

  describe('IRTScoringStrategy', () => {
    const strategy = new IRTScoringStrategy();
    it('calculates complexity-adjusted (IRT-like) score', () => {
      // Current IRT weighting in implementation:
      // beta(simple)=0.5, beta(intermediate)=1.0, beta(expert)=2.0
      // ability = 0.5 - ((2.5-1.0)*0.1) + 2.0 = 2.35
      // totalPotential = 3.5 => 2.35 / 3.5 = 67.14... -> 67
      expect(strategy.calculateOverallScore(mockAnswers)).toBe(67);
    });

    it('falls back to simple difficulty and clamps lower bound', () => {
      const hardMisses: EvaluatedAnswer[] = [
        { question: { id: 'q1', difficulty: undefined } as any, examQuestion: { isCorrect: false } as any },
        { question: { id: 'q2', difficulty: undefined } as any, examQuestion: { isCorrect: false } as any },
      ];
      expect(strategy.calculateOverallScore(hardMisses)).toBe(0);
    });

    it('returns zero for empty dimension totals', () => {
      const dims = strategy.calculateDimensionScores([], {
        'domain:d0': { total: 0, correct: 0, name: 'Domain Zero' },
      });
      expect(dims[0].accuracy).toBe(0);
      expect(dims[0].score).toBe(0);
    });
  });

  describe('MasteryScoringStrategy', () => {
    const strategy = new MasteryScoringStrategy();
    it('calculates basic mastery percentage', () => {
       expect(strategy.calculateOverallScore(mockAnswers)).toBe(67);
    });

    it('applies topic gap penalty and clamps to zero', () => {
      const answers: EvaluatedAnswer[] = [
        { question: { topicId: 't1' } as any, examQuestion: { isCorrect: false } as any },
        { question: { topicId: 't1' } as any, examQuestion: { isCorrect: false } as any },
        { question: { topicId: 't1' } as any, examQuestion: { isCorrect: false } as any },
      ];
      expect(strategy.calculateOverallScore(answers)).toBe(0);
    });

    it('falls back to id when dimension name is missing', () => {
      const dims = strategy.calculateDimensionScores([], {
        'topic:t-fallback': { total: 0, correct: 0 },
      });
      expect(dims[0].name).toBe('t-fallback');
      expect(dims[0].accuracy).toBe(0);
    });
  });

  describe('Dimension Calculations (Generic check)', () => {
    const strategies = [
      new PercentageScoringStrategy(),
      new WeightedScoringStrategy(),
      new IRTScoringStrategy(),
      new MasteryScoringStrategy()
    ];

    strategies.forEach(s => {
      it(`${s.getName()} calculates correct dimension accuracy`, () => {
        const results = s.calculateDimensionScores(mockAnswers, mockDimensions);
        expect(results[0].accuracy).toBe(50);
        expect(results[0].total).toBe(10);
        expect(results[0].correct).toBe(5);
      });
    });
  });
});
