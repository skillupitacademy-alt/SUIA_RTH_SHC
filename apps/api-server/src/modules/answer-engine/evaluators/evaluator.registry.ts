import { CodeMCQEvaluator } from './code-mcq.evaluator';
import type { IAnswerEvaluator } from './evaluator.interface';
import { MCQEvaluator } from './mcq.evaluator';

class DefaultEvaluator implements IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): boolean {
    return correctAnswer === userAnswer;
  }
}

export const EvaluatorRegistry: Record<string, IAnswerEvaluator> = {
  'mcq': new MCQEvaluator(),
  'code_mcq': new CodeMCQEvaluator(),
  'default': new DefaultEvaluator(),
};

export function getEvaluator(type: string): IAnswerEvaluator {
  return EvaluatorRegistry[type] ?? EvaluatorRegistry['default'];
}
