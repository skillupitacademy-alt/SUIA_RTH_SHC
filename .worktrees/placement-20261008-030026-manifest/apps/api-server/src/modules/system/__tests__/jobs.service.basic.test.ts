import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { JobsService } from '@/modules/system/jobs.service'

describe('JobsService basic branches', () => {
  it('updateJobStatus writes status', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 'j1', status: 'completed' }])
    const where = vi.fn().mockReturnValue({ returning })
    const set = vi.fn().mockReturnValue({ where })
    ;(db.update as any) = vi.fn().mockReturnValue({ set })

    const res = await JobsService.updateJobStatus('j1', 'completed' as any, { foo: 'bar' })
    expect(res?.status).toBe('completed')
  })
})
