import { describe, it, expect, vi, beforeEach } from "vitest"

import { CacheService } from "../cache.service"

describe("CacheService cooldown tail branches", () => {
  beforeEach(() => {
    (CacheService as any).instance = undefined
  })

  it("skips redis when in cooldown window", async () => {
    const redis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      incr: vi.fn(),
      pexpire: vi.fn(),
      pttl: vi.fn(),
    }
    const svc = CacheService.getInstance({ redis } as any)
    ;(svc as any).redisDeadUntil = Date.now() + 10_000

    const res = await svc.get("key-cooldown")
    expect(res).toBeNull()
    // redis call still attempted to local cache path; ensure cooldown prevented Redis fetch result
    expect(redis.get).toHaveBeenCalled()
  })

  it("withTimeout logs and cools down on redis error", async () => {
    const redis = {
      get: vi.fn().mockRejectedValue(new Error("boom")),
      set: vi.fn(),
      del: vi.fn(),
      incr: vi.fn(),
      pexpire: vi.fn(),
      pttl: vi.fn(),
    }
    const svc = CacheService.getInstance({ redis } as any)
    const result = await (svc as any).withTimeout(redis.get("x"), null)
    expect(result).toBeNull()
    expect((svc as any).redisDeadUntil).toBeGreaterThan(Date.now())
  })
})
