import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { AnalyticsService } from '../analytics.service'

describe('AnalyticsService refreshAllViews', () => {
  it('refreshes all views successfully', async () => {
    (db.execute as any) = vi.fn().mockResolvedValue(undefined)
    await expect(AnalyticsService.refreshAllViews()).resolves.not.toThrow()
    expect((db.execute as any)).toHaveBeenCalled()
  })

  it('throws when any view fails and logs error path', async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(undefined) // first view ok
      .mockRejectedValueOnce(new Error('boom')) // second view fails
      .mockResolvedValue(undefined) // remaining ok
    ;(db.execute as any) = execute

    await expect(AnalyticsService.refreshAllViews()).rejects.toThrow(/Failed to refresh/)
    expect(execute).toHaveBeenCalled()
  })
})
