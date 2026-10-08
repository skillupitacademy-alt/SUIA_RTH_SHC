import { beforeEach, describe, expect, it, vi } from "vitest"

import { CacheService } from "../cache.service"
import { logger } from "@/lib/logger"

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }) },
}))

const mockLogger = logger as unknown as { warn: ReturnType<typeof vi.fn> }

beforeEach(() => {
  (CacheService as unknown as { instance?: CacheService }).instance = undefined
})

describe("cache.service cooldown and error tails", () => {
  it("returns configured:false when redis client missing", async () => {
    const service = CacheService.getInstance({ redis: null })
    const result = await service.getUsage()
    expect(result).toEqual({ configured: false })
  })

  it("cooldown path still falls back to null", async () => {
    const redisGet = vi.fn()
    const service = CacheService.getInstance({ redis: { get: redisGet } as any })
    ;(service as any).redisDeadUntil = Date.now() + 60_000
    const res = await service.get("key")
    expect(res).toBeNull()
    expect(redisGet).toHaveBeenCalledWith("key")
  })
})
