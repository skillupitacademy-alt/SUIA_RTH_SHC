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

import { DomainService, SubjectService, TopicService } from "../domain.service";

describe("DomainService cache invalidation branches", () => {
  beforeEach(() => {
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    };
    mockDb = {
      query: {
        domains: { findMany: vi.fn(), findFirst: vi.fn() },
        subjects: { findMany: vi.fn() },
        topics: { findMany: vi.fn() },
      },
      insert: vi.fn().mockReturnValue({ values: () => ({ returning: vi.fn().mockResolvedValue([]) }) }),
      update: vi.fn().mockReturnValue({ set: () => ({ where: () => ({ returning: vi.fn().mockResolvedValue([]) }) }) }),
      delete: vi.fn().mockReturnValue({ where: () => ({ returning: vi.fn().mockResolvedValue([]) }) }),
    };
  });

  it("getAllDomains returns cached array when present", async () => {
    mockCache.get.mockResolvedValue([{ id: "cached" }]);
    const res = await DomainService.getAllDomains();
    expect(res[0].id).toBe("cached");
    expect(mockDb.query.domains.findMany).not.toHaveBeenCalled();
  });

  it("deleteSubject invalidates domains cache", async () => {
    await SubjectService.deleteSubject("s1");
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domains:all");
  });
});
