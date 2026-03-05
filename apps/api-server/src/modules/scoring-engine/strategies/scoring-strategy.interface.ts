import type { InferSelectModel } from 'drizzle-orm';
import type { exams, examQuestions, questions } from '@quiz/db';

export interface EvaluatedAnswer {
  question: InferSelectModel<typeof questions>;
  examQuestion: InferSelectModel<typeof examQuestions> & {
    isCorrect: boolean | null;
  };
}

export interface DimensionScore {
  type: string;
  id: string;
  name?: string;
  score: number;
  accuracy: number;
  total: number;
  correct: number;
}

export interface IScoringStrategy {
  calculateOverallScore(answers: EvaluatedAnswer[]): number;
  calculateDimensionScores(answers: EvaluatedAnswer[], dimensions: Record<string, { total: number; correct: number; name?: string }>): DimensionScore[];
  getName(): string;
}
