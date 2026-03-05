import { describe, it, expect, vi } from 'vitest'

import { TokenService } from '../token.service'
import { AuditService } from '../audit.service'
import { AuthService } from '../auth.service'

vi.mock('../token.service')

vi.mock('../audit.service')

describe('AuthService.refresh invalid audience', () => {
  it('logs and throws when audience mismatch', async () => {
    const token = 'e30.eyJpc0FkbWluIjpmYWxzZX0.sig' // header {}, payload { isAdmin: false }
    const verifySpy = vi.spyOn(TokenService.prototype, 'verifyRefreshToken').mockRejectedValue(new Error('aud mismatch'))
    const logSpy = vi.spyOn(AuditService.prototype, 'log').mockResolvedValue(undefined as any);

    const { container } = await import('../../core/container')
    await expect(container.get(AuthService).refresh(token, '1.1.1.1', undefined, 'admin')).rejects.toThrow(/Invalid refresh _token/)
    expect(logSpy).toHaveBeenCalled()
  })
})
