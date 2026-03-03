import { describe, it, expect } from 'vitest'

import { ReportInterpreter } from '@/modules/report-engine/report-interpreter.service'

describe('ReportInterpreter empty data branches', () => {
  it('handles empty subtopics/skills/heatmap gracefully', () => {
    const report: any = {
      score: 50,
      mastery: 40,
      readiness: 30,
      percentile: 50,
      confidence: 'LOW',
      subtopics: [],
      skills: [],
      heatmap: [],
      difficulty: [],
      timeBuckets: { stable: 0, logic: 0, neural: 0 },
      questions: [],
      ai: { status: 'NOT_READY', actions: [], nextExamHours: 0 },
    }
    const res = ReportInterpreter.interpret(report)
    expect(res.subtopics[0]).toMatch(/No subtopic-level/)
    expect(res.skills[0]).toMatch(/Insufficient data/)
  })
})
