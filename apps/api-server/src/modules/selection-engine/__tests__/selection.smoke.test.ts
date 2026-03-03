import { describe, it, expect } from 'vitest'

describe('SelectionService module loads', () => {
  it('imports without error', async () => {
    const mod = await import('../selection.service')
    expect(mod.SelectionService).toBeDefined()
  })
})
