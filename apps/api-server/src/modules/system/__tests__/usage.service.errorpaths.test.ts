import { describe, it, expect, vi, beforeEach } from "vitest";

import { UsageService } from "../usage.service";
import { cacheService } from "@/modules/core/cache.service";

vi.mock("@/modules/core/cache.service", () => ({
  cacheService: {
    getUsage: vi.fn(),
  },
}));

vi.mock("@quiz/db", () => ({
  db: {
    execute: vi.fn().mockRejectedValue(new Error("neon fail")),
  },
}));

describe("UsageService error paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns _error when Redis usage call throws", async () => {
    (cacheService.getUsage as any).mockRejectedValue(new Error("redis down"));
    const res = await (UsageService as any).getRedisUsage();
    expect(res.status).toBe("_error");
    expect(res._error?.message).toContain("redis down");
  });

  it("returns _error when Cloudflare fetch fails", async () => {
    process.env.CLOUDFLARE_API_TOKEN = "x";
    process.env.CLOUDFLARE_ZONE_ID = "zone";
    vi.stubGlobal("fetch", () => Promise.reject(new Error("cf fail")));
    const res = await (UsageService as any).getCloudflareStats();
    expect(res.status).toBe("_error");
    expect(res._error?.message).toContain("cf fail");
    vi.unstubAllGlobals();
  });
});
