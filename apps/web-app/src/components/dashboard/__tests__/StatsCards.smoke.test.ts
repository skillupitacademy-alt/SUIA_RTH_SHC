import { describe, it, expect } from 'vitest';
import { StatsGrid } from '../StatsCards';

describe('StatsGrid Smoke Test', () => {
  it('should not crash with undefined overview', () => {
    // @ts-ignore
    const result = StatsGrid({ overview: undefined, deltaPct: null, healthStatus: undefined });
    expect(result).toBeDefined();
  });

  it('should not crash with null deltaPct', () => {
    // @ts-ignore
    const result = StatsGrid({ 
      overview: { avgScore: 50, totalExams: 2, masteryPoints: 10, weeklyExamsCount: 1, globalRank: null },
      deltaPct: null,
      healthStatus: 'green'
    });
    expect(result).toBeDefined();
  });

  it('should handle missing healthStatus gracefully', () => {
    // @ts-ignore
    const result = StatsGrid({ 
      overview: { avgScore: 50, totalExams: 2, masteryPoints: 10, weeklyExamsCount: 1, globalRank: null },
      deltaPct: 5,
      healthStatus: undefined
    });
    expect(result).toBeDefined();
  });
});
