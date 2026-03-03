import { describe, it, expect, vi } from 'vitest'

import { TokenService } from '../token.service'
import { AuditService } from '../audit.service'
import { AuthService } from '../auth.service'

vi.mock('../token.service', () => ({
  TokenService: {
    verifyRefreshToken: vi.fn(),
  },
}))

vi.mock('../audit.service', () => ({
  AuditService: {
    log: vi.fn(),
  },
}))

describe('AuthService.refresh invalid audience', () => {
  it('logs and throws when audience mismatch', async () => {
    const token = 'e30.eyJpc0FkbWluIjpmYWxzZX0.sig' // header {}, payload { isAdmin: false }
    ;(TokenService.verifyRefreshToken as any) = vi.fn().mockRejectedValue(new Error('aud mismatch'))

    await expect(AuthService.refresh(token, '1.1.1.1', undefined, 'admin')).rejects.toThrow(/Invalid refresh _token/)
    expect(AuditService.log).toHaveBeenCalled()
  })
})
