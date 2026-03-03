import { describe, it, expect } from 'vitest'

import { ReportInterpreter } from '../report-interpreter.service'
import type { PremiumReport } from '../report.engine'

const baseReport: PremiumReport = {
  score: 50,
  mastery: 50,
  readiness: 50,
  percentile: 2,
  confidence: 'LOW',
  subtopics: [],
  skills: [],
  heatmap: [],
  difficulty: [
    { level: 'simple', correct: 1, attempts: 2 },
    { level: 'inter', correct: 1, attempts: 2 },
    { level: 'expert', correct: 0, attempts: 1 },
  ],
  timeBuckets: { stable: 1, logic: 1, neural: 1 },
  time: { avgSeconds: 0, pacingScore: 0 },
  meta: { attempts: 0, cohort: 'test' },
}

describe('ReportInterpreter branches', () => {
  it('handles low scores and low confidence', () => {
    const result = ReportInterpreter.interpret({ ...baseReport, percentile: 1 })
    expect(result.kpi[0]).toContain('CRITICAL')
    expect(result.kpi.find(line => line.includes('Confidence Warning'))).toBeTruthy()
    expect(result.kpi.find(line => line.includes('1st percentile'))).toBeTruthy()
  })

  it('handles mastery scores and readiness ready', () => {
    const report: PremiumReport = {
      ...baseReport,
      score: 90,
      mastery: 90,
      readiness: 80,
      percentile: 95,
      confidence: 'HIGH',
    }
    const result = ReportInterpreter.interpret(report)
    expect(result.kpi[0]).toContain('MASTERY')
    expect(result.kpi.find(line => line.includes('READY'))).toBeTruthy()
    expect(result.kpi.find(line => line.includes('95th percentile'))).toBeTruthy()
  })
})
