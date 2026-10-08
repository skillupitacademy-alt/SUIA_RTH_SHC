import { describe, it, expect, vi, beforeEach } from "vitest";

import { CacheService } from "../cache.service";

describe("CacheService cooldown tail branches", () => {
  beforeEach(() => {
    (CacheService as any).instance = undefined;
  });

  it("withTimeout returns fallback when already in cooldown", async () => {
    const redis = { get: vi.fn(), set: vi.fn(), del: vi.fn() };
    const cache = CacheService.getInstance({ redis });
    (cache as any).redisDeadUntil = Date.now() + 5000;
    const res = await (cache as any).withTimeout(Promise.resolve("ignored"), "fallback");
    expect(res).toBe("fallback");
    expect(redis.get).not.toHaveBeenCalled();
  });

  it("set catches redis error and keeps local set", async () => {
    const redis = { set: vi.fn().mockRejectedValue(new Error("boom")) };
    const cache = CacheService.getInstance({ redis });
    await cache.set("k", "v");
    const v = await cache.get("k");
    expect(v).toBe("v");
  });
});
