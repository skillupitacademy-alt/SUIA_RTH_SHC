import { CodeMCQEvaluator } from './code-mcq.evaluator';
import type { IAnswerEvaluator } from './evaluator.interface';
import { MCQEvaluator } from './mcq.evaluator';
import { MultiSelectEvaluator } from './multi-select.evaluator';

class DefaultEvaluator implements IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): number {
    return correctAnswer === userAnswer ? 1 : 0;
  }
}

export interface IEvaluatorFactory {
  getEvaluator(type: string): IAnswerEvaluator;
  registerEvaluator(type: string, evaluator: IAnswerEvaluator): void;
}

export class EvaluatorFactory implements IEvaluatorFactory {
  private evaluators: Map<string, IAnswerEvaluator>;
  private defaultEvaluator: IAnswerEvaluator;

  constructor() {
    this.evaluators = new Map<string, IAnswerEvaluator>();
    this.defaultEvaluator = new DefaultEvaluator();

    // Register built-in evaluators
    this.registerEvaluator('mcq', new MCQEvaluator());
    this.registerEvaluator('code_mcq', new CodeMCQEvaluator());
    this.registerEvaluator('multi_select', new MultiSelectEvaluator());
  }

  registerEvaluator(type: string, evaluator: IAnswerEvaluator): void {
    this.evaluators.set(type, evaluator);
  }

  getEvaluator(type: string): IAnswerEvaluator {
    return this.evaluators.get(type) ?? this.defaultEvaluator;
  }
}
