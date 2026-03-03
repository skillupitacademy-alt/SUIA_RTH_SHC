import { describe, it, expect, vi, beforeEach } from "vitest"

import { CacheService } from "../cache.service"

describe("cache.service increment branches", () => {
  beforeEach(() => {
    ;(CacheService as any).instance = undefined
  })

  it("uses redis when available for increment", async () => {
    const redis = {
      incr: vi.fn().mockResolvedValue(1),
      pexpire: vi.fn().mockResolvedValue(undefined),
      pttl: vi.fn().mockResolvedValue(900),
    }
    const svc = CacheService.getInstance({ redis } as any)
    const res = await svc.increment("rate:key", 1000)
    expect(redis.incr).toHaveBeenCalledWith("rate:key")
    expect(res.count).toBe(1)
  })

  it("withTimeout returns fallback value on success path", async () => {
    const svc = CacheService.getInstance({ redis: null } as any)
    const val = await (svc as any).withTimeout(Promise.resolve("ignored"), "fallback")
    expect(val).toBe("fallback")
  })
})
