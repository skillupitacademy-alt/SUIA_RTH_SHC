import { describe, it, expect, beforeEach, vi } from "vitest"

import { CacheService } from "../cache.service"

describe("cache.service getUsage success path", () => {
  beforeEach(() => {
    ;(CacheService as any).instance = undefined
  })

  it("returns stats when redis provides info and dbsize", async () => {
    const redis = {
      info: vi.fn().mockResolvedValue("used_memory_human:1MB\r\n"),
      dbsize: vi.fn().mockResolvedValue(5),
    }
    const svc = CacheService.getInstance({ redis } as any)
    const res = await svc.getUsage()
    expect(res.configured).toBe(true)
    expect(res.keys).toBe(5)
    expect(res.memory).toBe("1MB")
  })
})
