import { describe, it, expect, vi, beforeEach } from "vitest"

import { CacheService } from "../cache.service"

describe("cache.service delByPrefix error branch", () => {
  beforeEach(() => {
    (CacheService as any).instance = undefined
  })

  it("swallows errors when deleting prefix keys", async () => {
    const svc = CacheService.getInstance({ redis: null } as any)
    const cache = (svc as any).cache
    cache.keys = vi.fn(() => {
      throw new Error("boom")
    })
    await svc.delByPrefix("metadata")
    expect(cache.keys).toHaveBeenCalled()
  })
})
