import { describe, it, expect, vi } from "vitest"

import { cacheService } from "../cache.service"
import { logger } from "@/lib/logger"

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }) },
}))

const mockLogger = logger as unknown as { warn: ReturnType<typeof vi.fn> }

describe("cache.service cooldown and error tails", () => {
  it("returns configured:false when redis client missing", async () => {
    const result = await cacheService.getUsage()
    expect(result).toEqual({ configured: false })
  })

  it("cooldown path when redis is marked unavailable", async () => {
    const originalUnavailable = (cacheService as any).isUnavailable
    ;(cacheService as any).isUnavailable = true
    const res = await cacheService.get("key")
    expect(res).toBeNull()
    ;(cacheService as any).isUnavailable = originalUnavailable
  })
})
