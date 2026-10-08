import { describe, it, expect, vi } from 'vitest'

import { QueueService } from '../queue.service'

describe('QueueService edge', () => {
  it('handles unknown handler gracefully', async () => {
    const svc = new QueueService()
    // no handlers registered for "missing"
    const res = await svc.enqueue('missing', { hello: 'world' })
    expect(res).toEqual({ success: false })
  })
})
