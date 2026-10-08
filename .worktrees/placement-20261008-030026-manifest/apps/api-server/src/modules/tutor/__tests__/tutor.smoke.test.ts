import { describe, it, expect } from 'vitest'

describe('Tutor module loads', () => {
  it('imports TutorService', async () => {
    const mod = await import('../tutor.service')
    expect(mod.TutorService).toBeDefined()
  })
})
