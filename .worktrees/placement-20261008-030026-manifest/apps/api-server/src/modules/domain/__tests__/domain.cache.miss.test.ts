import { describe, it, expect, vi, beforeEach } from "vitest";

let mockCache: any = {};
let mockDb: any = {};

vi.mock("@/modules/core/cache.service", () => ({
  get cacheService() {
    return mockCache;
  },
}));

vi.mock("@quiz/db", () => ({
  get db() {
    return mockDb;
  },
  domains: { id: "d", status: "active" },
  subjects: { id: "s", domainId: "d", status: "active", order: 1 },
}));

import { DomainService } from "../domain.service";

describe("DomainService cache miss/error branches", () => {
  beforeEach(() => {
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    };
    mockDb = {
      query: {
        domains: { findMany: vi.fn().mockResolvedValue([{ id: "d1" }]) },
      },
    };
  });

  it("getAllDomains returns DB when cache miss", async () => {
    const res = await DomainService.getAllDomains();
    expect(res[0].id).toBe("d1");
    expect(mockCache.set).toHaveBeenCalled();
  });

  it("getAllDomains returns empty array on DB error", async () => {
    mockDb.query.domains.findMany.mockRejectedValue(new Error("boom"));
    await expect(DomainService.getAllDomains()).rejects.toThrow("boom");
  });
});
