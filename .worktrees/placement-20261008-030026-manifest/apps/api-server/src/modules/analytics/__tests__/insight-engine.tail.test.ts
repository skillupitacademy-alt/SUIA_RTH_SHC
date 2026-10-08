import { describe, it, expect } from 'vitest';
import { InsightEngineService } from '../insight-engine.service';

describe('InsightEngineService tail branches', () => {
  it('handles empty performance data with low confidence and no signals', () => {
    const res = InsightEngineService.analyzePerformanceTrend('User', { dates: [], scores: [] });
    expect(res.confidence).toBe('low');
    expect(res.signals.length).toBe(0); // hits early averages/zeros path (lines ~33)
    expect(res.sampleSize).toBe(0);
  });

  it('flags volatility and zeros when present', () => {
    const res = InsightEngineService.analyzePerformanceTrend('User', { dates: ['d1','d2','d3','d4'], scores: [0, 90, 0, 10] });
    const text = res.signals.map(s => s.text).join(' ');
    expect(text).toMatch(/High Volatility/); // variance path ~64
    expect(text).toMatch(/abandoned sessions/); // zeros path ~80-84
  });
});

