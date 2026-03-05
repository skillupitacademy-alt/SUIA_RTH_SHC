import type { ExamQuestionDimension, IDimensionCalculator, QuestionDimension, ScoringDimension, TopicDimension } from './calculator.interface';
import { DifficultyCalculator } from './difficulty.calculator';
import { HierarchyCalculator } from './hierarchy.calculator';
import { SkillCalculator } from './skill.calculator';

export class DimensionRegistry {
  private static calculators: IDimensionCalculator[] = [
    new HierarchyCalculator(),
    new DifficultyCalculator(),
    new SkillCalculator(),
  ];

  static getAllDimensions(context: { question: QuestionDimension; topic: TopicDimension | null; examQuestion: ExamQuestionDimension | null }): ScoringDimension[] {
    return this.calculators.flatMap(calc => calc.calculate(context));
  }
}
