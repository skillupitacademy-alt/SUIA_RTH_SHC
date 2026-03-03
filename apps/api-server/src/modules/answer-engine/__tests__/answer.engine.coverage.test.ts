import { describe, it, expect } from 'vitest'

import { AnswerEvaluationEngine } from '../answer.engine'

describe('AnswerEvaluationEngine', () => {
  it('evaluates mcq and code_mcq with normalization', () => {
    expect(AnswerEvaluationEngine.evaluate('mcq', 'Yes', ' yes ')).toBe(true)
    expect(AnswerEvaluationEngine.evaluate('mcq', 'Yes', 'no')).toBe(false)

    expect(AnswerEvaluationEngine.evaluate('code_mcq', 'console.log(1);', '  console.log(1);\n')).toBe(true)
    expect(AnswerEvaluationEngine.evaluate('code_mcq', 'return x+1', 'return  x + 2')).toBe(false)
  })

  it('returns false when user answer missing and supports default branch', () => {
    expect(AnswerEvaluationEngine.evaluate('mcq', 'a', '')).toBe(false)
    // default branch (should behave like strict equality)
    expect(AnswerEvaluationEngine.evaluate('mcq' as any, 'a', 'a')).toBe(true)
  })
})
