import { describe, it, expect, vi } from 'vitest'

import { SelectionService } from '../selection.service'

describe('SelectionService.composeExam static and dynamic paths', () => {
  it('returns static questions when blueprint has questionIds', async () => {
    const blueprint = { questionIds: ['q1', 'q2'] }
    vi.spyOn(SelectionService as any, 'resolveBlueprint').mockResolvedValue(blueprint)
    vi.spyOn(SelectionService as any, 'fetchStaticQuestions').mockResolvedValue(['q1', 'q2'])

    const result = await SelectionService.composeExam('u1', 'bp1', 'idem')
    expect(result).toEqual(['q1', 'q2'])
  })

  it('invokes dynamic selection when no static ids', async () => {
    vi.spyOn(SelectionService as any, 'resolveBlueprint').mockResolvedValue({ questionIds: [] })
    vi.spyOn(SelectionService as any, 'resolveSelectionCriteria').mockResolvedValue({
      finalSubtopicIds: [], actualTopicIds: [], actualSubjectIds: [], requestedTotal: 1, difficultyPref: 'simple'
    })
    vi.spyOn(SelectionService as any, 'executeDynamicSelection').mockResolvedValue([{ id: 'q3' }])

    const result = await SelectionService.composeExam('u1', 'bp1', 'idem')
    expect(result.questions).toEqual([{ id: 'q3' }])
    expect(result.blueprint).toEqual({ questionIds: [] })
  })
})
