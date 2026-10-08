import { describe, it, expect } from 'vitest';

import { InsightEngineService } from '../insight-engine.service';

describe('InsightEngineService branch coverage', () => {
  it('analyzePerformanceTrend emits good/dip/volatility/zeros signals together', () => {
    // latestScore lower than previous to trigger dip, includes zero for risk, wide spread for volatility
    const res = InsightEngineService.analyzePerformanceTrend('Alice', {
      dates: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'],
      scores: [90, 20, 95, 0, 60, 40], // variance high, last < previous (dip), includes zero
    });

    // confidence is 'medium' because sampleSize 6 but threshold for high is 8
    expect(res.confidence).toBe('medium');
    const texts = res.signals.map((s) => s.text).join(' ');
    expect(texts).toMatch(/Performance dip/);
    expect(texts).toMatch(/High Volatility/);
    expect(res.signals.some((s) => s.type === 'risk')).toBe(true); // zero included
    expect(res.nextSteps.length).toBeGreaterThan(0);
  });

  it('analyzeMasteryTrend hits memorization gap, growth, stagnation, and accuracy-high/score-low branches', () => {
    // Memorization gap + growth + stagnation
    const res1 = InsightEngineService.analyzeMasteryTrend(
      'Bob',
      { dates: ['d1', 'd2', 'd3', 'd4', 'd5'], accuracy: [40, 41, 42, 43, 44] },
      { scores: [90, 92, 94, 95, 96] }
    );
    const texts1 = res1.signals.map((s) => s.text).join(' ');
    expect(res1.confidence).toBe('high'); // sampleSize 5
    expect(texts1).toMatch(/Memorization Gap/); // line 132
    expect(texts1).toMatch(/Neural growth active/); // line 140
    expect(texts1).toMatch(/plateauing/); // stagnation line 146

    // High-accuracy but low-score branch (line 134)
    const res2 = InsightEngineService.analyzeMasteryTrend(
      'Cara',
      { dates: ['d1', 'd2'], accuracy: [85, 90] },
      { scores: [40, 45] }
    );
    const texts2 = res2.signals.map((s) => s.text).join(' ');
    expect(texts2).toMatch(/High Potential/);
  });
});
