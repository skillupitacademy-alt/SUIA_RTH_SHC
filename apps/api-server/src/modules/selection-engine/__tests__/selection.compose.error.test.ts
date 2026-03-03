import { describe, it, expect, vi } from 'vitest'

import { SelectionService } from '../selection.service'

describe('SelectionService.composeExam empty selection error', () => {
  it('throws when dynamic selection returns no questions', async () => {
    vi.spyOn(SelectionService as any, 'resolveBlueprint').mockResolvedValue({ questionIds: [] })
    vi.spyOn(SelectionService as any, 'resolveSelectionCriteria').mockResolvedValue({
      finalSubtopicIds: [], actualTopicIds: [], actualSubjectIds: [], requestedTotal: 1, difficultyPref: 'simple'
    })
    vi.spyOn(SelectionService as any, 'executeDynamicSelection').mockResolvedValue([])

    await expect(SelectionService.composeExam('u1', 'bp1', 'idem')).resolves.toEqual({
      questions: [],
      blueprint: { questionIds: [] },
    })
  })
})
