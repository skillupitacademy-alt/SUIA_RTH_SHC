import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { SecurityService } from '../security.service'

describe('SecurityService lockout paths', () => {
  it('clears attempts on success and locks after threshold', async () => {
    ;(db.query as any).users = { findFirst: vi.fn().mockResolvedValue({ id: 'u1', email: 'a@b.com' }) }
    // success clears
    ;(db.delete as any) = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    await SecurityService.trackLoginAttempt('1.1.1.1', 'a@b.com', true)
    expect(db.delete).toHaveBeenCalled()

    // failures accumulate
    ;(db.query as any).loginAttempts = {
      findFirst: vi.fn()
        .mockResolvedValueOnce({ id: 'la1', userId: 'u1', ip: '1.1.1.1', attempts: 4 })
        .mockResolvedValueOnce({ id: 'la1', userId: 'u1', ip: '1.1.1.1', attempts: 9 })
        .mockResolvedValueOnce({ id: 'la1', userId: 'u1', ip: '1.1.1.1', attempts: 19, lockedUntil: new Date(Date.now() + 60000) }),
    }
    ;(db.update as any) = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
    await SecurityService.trackLoginAttempt('1.1.1.1', 'a@b.com', false) // 5 -> lock 15m
    await SecurityService.trackLoginAttempt('1.1.1.1', 'a@b.com', false) // 10 -> lock 60m

    // account locked when lockedUntil in future
    const locked = await SecurityService.isAccountLocked('a@b.com', '1.1.1.1')
    expect(locked).toBe(true)
  })

  it('returns false if user not found in isAccountLocked (Line 58)', async () => {
    ;(db.query as any).users = { findFirst: vi.fn().mockResolvedValue(undefined) }
    const result = await SecurityService.isAccountLocked('none@b.com', '1.1.1.1')
    expect(result).toBe(false)
  })
})
