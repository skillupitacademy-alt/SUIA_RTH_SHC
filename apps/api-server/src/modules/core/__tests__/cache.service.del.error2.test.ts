import { describe, it, expect, vi, beforeEach } from "vitest";

import { CacheService } from "../cache.service";

describe("CacheService del redis error path", () => {
  beforeEach(() => {
    (CacheService as any).instance = undefined;
  });

  it("swallows redis.del errors", async () => {
    const redis = {
      del: vi.fn().mockRejectedValue(new Error("del boom")),
    };
    const cache = CacheService.getInstance({ redis });
    await cache.del("x");
    expect(redis.del).toHaveBeenCalled();
    // no throw
  });
});
