import { describe, it, expect, vi } from 'vitest'
import { queueService } from '../queue.service'
import { logger } from '@/lib/logger'

describe('QueueService (core)', () => {
  it('returns success true on enqueue success', async () => {
    process.env.QSTASH_TOKEN = 'tok'
    const QueueServiceMod = await import('../queue.service')
    ;(QueueServiceMod.QueueService as any).instance = undefined
    const svc = QueueServiceMod.QueueService.getInstance()
    Reflect.set(svc as any, 'qstashToken', 'tok')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: 'm1' }),
    } as any)
    const res = await svc.enqueue('JOB', { id: 1 })
    expect(res).toEqual({ success: true, messageId: 'm1' })
  })

  it('logs and returns success false on enqueue failure', async () => {
    process.env.QSTASH_TOKEN = 'tok'
    const QueueServiceMod = await import('../queue.service')
    ;(QueueServiceMod.QueueService as any).instance = undefined
    const svc = QueueServiceMod.QueueService.getInstance()
    Reflect.set(svc as any, 'qstashToken', 'tok')
    const spy = vi.spyOn(logger, 'error')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('bad'),
    } as any)
    const res = await svc.enqueue('JOB', { id: 1 })
    expect(res.success).toBe(false)
    expect(spy).toHaveBeenCalled()
  })
})
