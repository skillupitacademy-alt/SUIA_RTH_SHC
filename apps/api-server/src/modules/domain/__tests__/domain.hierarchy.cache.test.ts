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
  topics: { id: "t", subjectId: "s", status: "active", complexityLevel: 1 },
  subtopics: {},
}));

import { DomainService } from "../domain.service";

describe("DomainService getDomainHierarchy cache hit/miss", () => {
  beforeEach(() => {
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    };
    mockDb = {
      query: {
        domains: {
          findFirst: vi.fn().mockResolvedValue({ id: "d1", subjects: [] }),
        },
      },
    };
  });

  it("returns cached hierarchy when present", async () => {
    mockCache.get.mockResolvedValue({ id: "cached" });
    const res = await DomainService.getDomainHierarchy("d1");
    expect(res?.id).toBe("cached");
    expect(mockDb.query.domains.findFirst).not.toHaveBeenCalled();
  });

  it("fetches and caches on miss", async () => {
    const res = await DomainService.getDomainHierarchy("d1");
    expect(res?.id).toBe("d1");
    expect(mockCache.set).toHaveBeenCalled();
  });
});
