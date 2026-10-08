import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { AdaptiveTutorService } from '../adaptive-tutor.service'
import { UserAnalyticsService } from '@/modules/analytics/user-analytics.service'

describe('AdaptiveTutorService coverage', () => {
  it('returns prioritized insights for weak topics (uuid + name) and sorts critical first', async () => {
    vi.spyOn(UserAnalyticsService, 'getTopicPerformance').mockResolvedValue([
      { topicId: 'javascript', topicName: 'JavaScript', accuracy: 90 },
      { topicId: '11111111-1111-4111-8111-111111111111', topicName: 'Async', accuracy: 92 },
    ])

    ;(db.query as any).topics = {
      findMany: vi.fn().mockResolvedValue([
        { id: '11111111-1111-4111-8111-111111111111', name: 'Async', learningUrl: 'https://learn/async' },
        { id: 't-js', name: 'javascript', learningUrl: 'https://learn/js' },
      ]),
    }

    const insights = await AdaptiveTutorService.generateInsights('u1', [
      { topicId: '11111111-1111-4111-8111-111111111111', accuracy: 40 }, // critical
      { topicId: 'javascript', accuracy: 70 }, // performance dip vs historical 90
      { topicId: 'css', accuracy: 95 }, // filtered out (>=80)
    ])

    expect(insights).toHaveLength(2)
    expect(insights.map(i => i.topicName)).toEqual(expect.arrayContaining(['Async', 'javascript']))
    expect(insights.every(i => i.priority === 'critical')).toBe(true)
    expect(insights.find(i => i.topicName === 'Async')?.learningUrl).toBe('https://learn/async')
  })

  it('returns false when master notes missing and true when notes exist, sending notification', async () => {
    const valuesSpy = vi.fn().mockResolvedValue(undefined)
    ;(db.insert as any) = vi.fn().mockReturnValue({ values: valuesSpy })

    // first call: topic missing notes
    ;(db.query as any).topics = { findFirst: vi.fn().mockResolvedValue({ id: 't1', name: 'JS', detailedNotesPath: null }) }

    const noNotes = await AdaptiveTutorService.requestMasterNotes('u1', 't1')
    expect(noNotes).toBe(false)

    // second call: topic has notes and user email present
    ;(db.query as any).topics.findFirst = vi.fn().mockResolvedValue({ id: 't1', name: 'JS', detailedNotesPath: '/notes/js.pdf' })
    ;(db.query as any).users = { findFirst: vi.fn().mockResolvedValue({ id: 'u1', email: 'user@test.com' }) }

    const hasNotes = await AdaptiveTutorService.requestMasterNotes('u1', 't1')
    expect(hasNotes).toBe(true)
    expect(valuesSpy).toHaveBeenCalled()
  })
})
