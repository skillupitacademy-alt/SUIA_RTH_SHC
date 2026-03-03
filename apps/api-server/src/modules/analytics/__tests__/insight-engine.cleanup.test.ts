import { describe, it, expect } from 'vitest';
import { InsightEngineService } from '../insight-engine.service';

describe('InsightEngineService remaining branches', () => {
  it('covers empty / low-sample performance trend (lines 33-42)', () => {
    const res = InsightEngineService.analyzePerformanceTrend('User', { dates: [], scores: [] });
    expect(res.confidence).toBe('low');
    expect(res.signals.length).toBe(0);
  });

  it('hits memorization gap and stagnation paths (lines 64, 80-84)', () => {
    const res = InsightEngineService.analyzeMasteryTrend(
      'User',
      { dates: ['d1', 'd2', 'd3'], accuracy: [40, 45, 35] },
      { scores: [90, 85, 88] }, // high score, low accuracy triggers memorization gap
    );
    const text = res.signals.map(s => s.text).join(' ');
    expect(text).toMatch(/Memorization Gap/i);
    expect(text).toMatch(/accuracy/);
  });
});
