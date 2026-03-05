import { IScoringStrategy } from './scoring-strategy.interface';
import { PercentageScoringStrategy } from './percentage-scoring.strategy';
import { WeightedScoringStrategy } from './weighted-scoring.strategy';
import { IRTScoringStrategy } from './irt-scoring.strategy';
import { MasteryScoringStrategy } from './mastery-scoring.strategy';

export class ScoringStrategyRegistry {
  private static strategies = new Map<string, IScoringStrategy>();

  static {
    // Pre-register default strategies
    this.register(new PercentageScoringStrategy());
    this.register(new WeightedScoringStrategy());
    this.register(new IRTScoringStrategy());
    this.register(new MasteryScoringStrategy());
  }

  static register(strategy: IScoringStrategy) {
    this.strategies.set(strategy.getName(), strategy);
  }

  static get(name: string = 'percentage'): IScoringStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      // Fallback to percentage if unknown
      return this.strategies.get('percentage')!;
    }
    return strategy;
  }
}
