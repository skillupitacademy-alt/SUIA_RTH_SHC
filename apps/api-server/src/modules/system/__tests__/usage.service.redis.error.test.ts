import { describe, it, expect, vi, beforeEach } from "vitest";

import { UsageService } from "../usage.service";
import { cacheService } from "@/modules/core/cache.service";

vi.mock("@/modules/core/cache.service", () => ({
  cacheService: {
    getUsage: vi.fn(),
  },
}));

describe("UsageService Redis error path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns _error when cacheService.getUsage rejects", async () => {
    (cacheService.getUsage as any).mockRejectedValue(new Error("redis boom"));
    const res = await (UsageService as any).getRedisUsage();
    expect(res.status).toBe("_error");
    expect(res._error?.message).toContain("redis boom");
  });
});
