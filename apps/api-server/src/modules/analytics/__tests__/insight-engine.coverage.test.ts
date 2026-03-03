import { describe, it, expect } from 'vitest'

import { InsightEngineService } from '../insight-engine.service'

describe('InsightEngineService', () => {
  it('analyzes performance trend with volatility and zeros', () => {
    const result = InsightEngineService.analyzePerformanceTrend('Alex', {
      dates: ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'],
      scores: [0, 0, 40, 90, 30],
    })

    expect(result.confidence).toBe('medium')
    expect(result.signals.some(s => s.type === 'risk')).toBe(true) // zeros trigger risk
    expect(result.signals.length).toBeGreaterThan(0)
  })

  it('analyzes mastery trend with divergence and stagnation branches', () => {
    const result = InsightEngineService.analyzeMasteryTrend(
      'Sam',
      { dates: ['d1', 'd2', 'd3', 'd4', 'd5'], accuracy: [30, 35, 34, 90, 88] },
      { scores: [40, 85, 20, 45] },
    )

    expect(result.confidence).toBe('high')
    expect(result.signals.find(s => s.type === 'risk')).toBeTruthy()
    expect(result.nextSteps.length).toBeGreaterThan(0)
  })
})
