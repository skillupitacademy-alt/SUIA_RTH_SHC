import { describe, it, expect } from 'vitest';

import { InsightEngineService } from '../insight-engine.service';

describe('InsightEngineService remaining branches', () => {
  it('analyzePerformanceTrend emits good signal when latest >=80 and no dip', () => {
    const res = InsightEngineService.analyzePerformanceTrend('Dana', {
      dates: ['d1', 'd2', 'd3'],
      scores: [70, 82, 85], // latest high, no zeros, low variance
    });
    const texts = res.signals.map((s) => s.text).join(' ');
    expect(texts).toMatch(/latest score of 85/); // line ~51
    expect(res.confidence).toBe('low'); // sample size <4
  });

  it('analyzePerformanceTrend hits zeroCount >=2 branch', () => {
    const res = InsightEngineService.analyzePerformanceTrend('Eve', {
      dates: ['d1', 'd2', 'd3', 'd4'],
      scores: [0, 0, 10, 20],
    });
    expect(res.signals.some((s) => s.type === 'risk')).toBe(true); // zeroCount path lines 58–60
  });

  it('analyzeMasteryTrend hits stagnation branch (abs diff <3)', () => {
    const res = InsightEngineService.analyzeMasteryTrend(
      'Frank',
      { dates: ['d1', 'd2', 'd3', 'd4'], accuracy: [50, 51, 50, 51] },
      { scores: [60, 61, 62, 63] }
    );
    const texts = res.signals.map((s) => s.text).join(' ');
    expect(texts).toMatch(/Stagnation Warning/); // line ~146
  });
});
