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
  });

  describe('WeightedScoringStrategy', () => {
    const strategy = new WeightedScoringStrategy();
    it('calculates weighted score (simple=1, inter=2, expert=3)', () => {
      // Total weight: 1 (q1) + 2 (q2) + 3 (q3) = 6
      // Earned weight: 1 (q1) + 0 (q2) + 3 (q3) = 4
      // 4/6 = 67%
      expect(strategy.calculateOverallScore(mockAnswers)).toBe(67);
    });
  });

  describe('IRTScoringStrategy', () => {
    const strategy = new IRTScoringStrategy();
    it('calculates complexity-adjusted (IRT-like) score', () => {
      // Logic: simple=1, intermediate=1.2, expert=1.5
      // Total value: 1 + 1.2 + 1.5 = 3.7
      // Earned value: 1 + 0 + 1.5 = 2.5
      // 2.5 / 3.7 = ~67.56% -> 68%
      expect(strategy.calculateOverallScore(mockAnswers)).toBe(68);
    });
  });

  describe('MasteryScoringStrategy', () => {
    const strategy = new MasteryScoringStrategy();
    it('calculates basic mastery percentage', () => {
       expect(strategy.calculateOverallScore(mockAnswers)).toBe(67);
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
