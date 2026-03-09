import { describe, it, expect } from 'vitest';
import { StatsGrid } from '../StatsCards';

describe('StatsGrid Smoke Test', () => {
  it('should not crash with undefined overview', () => {
    // @ts-expect-error intentionally passing undefined to verify resilience
    const result = StatsGrid({ overview: undefined, deltaPct: null, healthStatus: undefined });
    expect(result).toBeDefined();
  });

  it('should not crash with null deltaPct', () => {
    // @ts-expect-error intentionally missing optional props
    const result = StatsGrid({ 
      overview: { avgScore: 50, totalExams: 2, masteryPoints: 10, weeklyExamsCount: 1, globalRank: null },
      deltaPct: null,
      healthStatus: 'green'
    });
    expect(result).toBeDefined();
  });

  it('should handle missing healthStatus gracefully', () => {
    // @ts-expect-error intentionally missing healthStatus
    const result = StatsGrid({ 
      overview: { avgScore: 50, totalExams: 2, masteryPoints: 10, weeklyExamsCount: 1, globalRank: null },
      deltaPct: 5,
      healthStatus: undefined
    });
    expect(result).toBeDefined();
  });
});
