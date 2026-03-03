import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { AuditService } from '../audit.service'

describe('AuditService log', () => {
  it('writes audit log', async () => {
    ;(db.insert as any) = vi.fn().mockReturnValue({
      values: () => Promise.resolve(),
    })
    await expect(AuditService.log({ action: 'test', userId: 'u1', metadata: { a: 1 } })).resolves.not.toThrow()
  })

  it('swallows errors when insert fails', async () => {
    ;(db.insert as any) = vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis(), then: vi.fn().mockRejectedValue(new Error('db fail')) })
    await expect(AuditService.log({ action: 'fail' })).resolves.not.toThrow()
  })

  it('handles non-Error objects in catch (Line 29)', async () => {
    ;(db.insert as any) = vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis(), then: vi.fn().mockRejectedValue('string error') })
    await expect(AuditService.log({ action: 'fail' })).resolves.not.toThrow()
  })
})
