import { describe, it, expect } from 'vitest'

import { TokenService } from '../token.service'

describe('TokenService.getAccessToken', () => {
  it('picks scope-specific cookies and header fallback', () => {
    const req: any = {
      cookies: {
        get: (key: string) => {
          const map: Record<string, { value: string } | undefined> = {
            admin_accessToken: { value: 'adminTok' },
            accessToken: { value: 'userTok' },
            infra_accessToken: { value: 'infraTok' },
          }
          return map[key]
        },
      },
      headers: { get: () => 'Bearer headerTok' },
    }

    expect(TokenService.getAccessToken(req as any, { scope: 'admin' })).toBe('adminTok')
    expect(TokenService.getAccessToken(req as any, { scope: 'user' })).toBe('userTok')
    expect(TokenService.getAccessToken(req as any, { scope: 'infrastructure' })).toBe('infraTok')
    // fallback no scope -> first cookie found (adminTok), not header
    expect(TokenService.getAccessToken(req as any)).toBe('userTok')
  })
})
