import { describe, it, expect } from 'vitest'

describe('AnswerEvaluationEngine smoke', () => {
  it('imports without error', async () => {
    const mod = await import('@/modules/answer-engine/answer.engine')
    expect(mod.AnswerEvaluationEngine).toBeDefined()
  })
})
