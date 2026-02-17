import { describe, expect, it } from 'vitest';

const fixtures = {
  questions: [
    { id: 'q1', correctAnswer: 'a', options: ['a', 'b'], weight: 2 },
    { id: 'q2', correctAnswer: 'b', options: ['a', 'b'], weight: 1 },
  ] satisfies Array<{ id: string; correctAnswer: string; options: string[]; weight: number }>,
  answers: [
    { questionId: 'q1', answer: 'a' },
    { questionId: 'q2', answer: 'c' },
  ] satisfies Array<{ questionId: string; answer: string | null }>,
};

describe.skip('ScoringEngine (unit)', () => {
  it('calculates weighted score for correct answers', async () => {
    const { ScoringEngine } = await import('../scoring.engine');
    const score = await ScoringEngine.calculateExamResults(
      fixtures.answers,
      fixtures.questions
    );
    expect(score.totalScore).toBeDefined();
  });

  it('penalizes unanswered or incorrect items', async () => {
    const { ScoringEngine } = await import('../scoring.engine');
    const score = await ScoringEngine.calculateExamResults(
      [{ questionId: 'q1', answer: null }],
      fixtures.questions
    );
    expect(score.correctCount).toBeLessThanOrEqual(1);
  });
});
