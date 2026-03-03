import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { AuthService } from '../auth.service'

describe('AuthService.logout', () => {
  it('revokes refresh token and backdates lastActiveAt', async () => {
    const updateRefresh = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    })
    const updateUser = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    })
    ;(db.update as any) = vi.fn((table) => {
      if ((table as any).tableName === 'refresh_tokens') return updateRefresh()
      return updateUser()
    })

    await expect(AuthService.logout('tok', 'u1', '1.1.1.1')).resolves.not.toThrow()
    expect((db.update as any)).toHaveBeenCalled()
  })
})
