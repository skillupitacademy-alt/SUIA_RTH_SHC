import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { JobsService } from '../jobs.service'
import { JobStatus } from '@quiz/types'

describe('JobsService branch coverage', () => {
  it('listJobs builds where clause from filters', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'j1' }])
    ;(db.query as any) = { backgroundJobs: { findMany } }
    ;(db.select as any) = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue([{ count: 1 }]),
      }),
    })

    const result = await JobsService.listJobs({ userId: 'u1', status: JobStatus.PENDING, limit: 5, offset: 0 })
    expect(findMany).toHaveBeenCalled()
    expect(result.total).toBe(1)
  })

  it('simulateJob short-circuits when mock not allowed', async () => {
    process.env.ALLOW_MOCK_JOBS = 'false'
    process.env.NODE_ENV = 'production'
    await expect(JobsService.simulateJob('job1', 'u1')).resolves.not.toThrow()
  })
})
