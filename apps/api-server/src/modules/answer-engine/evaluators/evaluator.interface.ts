export interface IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): boolean;
}
