import { describe, it, expect, vi, beforeEach } from "vitest";

import { CacheService } from "../cache.service";

describe("CacheService cooldown tails", () => {
  beforeEach(() => {
    (CacheService as any).instance = undefined;
  });

  it("returns fallback and enters cooldown when redis get throws", async () => {
    const redis = {
      get: vi.fn().mockRejectedValue(new Error("boom")),
      set: vi.fn(),
      del: vi.fn(),
    };
    const cache = CacheService.getInstance({ redis });
    const val = await cache.get("k");
    expect(val).toBeNull();
    expect((cache as any).redisDeadUntil).toBeGreaterThan(Date.now());
  });

  it("withTimeout short-circuits when already in cooldown", async () => {
    const redis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    const cache = CacheService.getInstance({ redis });
    (cache as any).redisDeadUntil = Date.now() + 5000;

    const res = await (cache as any).withTimeout(Promise.resolve("ignored"), "fallback");
    expect(res).toBe("fallback");
    expect(redis.get).not.toHaveBeenCalled();
  });
});
