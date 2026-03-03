import { describe, it, expect, vi, beforeEach } from "vitest"

import { DomainService } from "../domain.service"
import { cacheService } from "@/modules/core/cache.service"
import { db } from "@quiz/db"

vi.mock("@/modules/core/cache.service", () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock("@quiz/db", () => ({
  db: {
    query: {
      domains: { findFirst: vi.fn(), findMany: vi.fn() },
      resultsByDimension: { findMany: vi.fn() },
    },
    update: vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "d1" }]) })),
    delete: vi.fn(() => ({ where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "d2" }]) })),
    insert: vi.fn(() => ({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "d3" }]) })),
    select: vi.fn(),
  },
  domains: { id: "did", status: "active" },
  subjects: { id: "sid", status: "active", domainId: "did", order: 1 },
  topics: { id: "tid", status: "active", subjectId: "sid", complexityLevel: 1 },
  subtopics: { id: "sub" },
}))

const mockCache = cacheService as any
const mockDb = db as any

describe("DomainService cache branches extra", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getDomainHierarchy returns cached value when present", async () => {
    mockCache.get.mockResolvedValue({ id: "cached" })
    const res = await DomainService.getDomainHierarchy("x")
    expect(res).toEqual({ id: "cached" })
    expect(mockCache.get).toHaveBeenCalled()
    expect(mockDb.query.domains.findFirst).not.toHaveBeenCalled()
  })

  it("updateDomain invalidates caches", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await DomainService.updateDomain("d1", { name: "New" })
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domains:all")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domain-hierarchy:d1")
    expect(res[0].id).toBe("d1")
  })

  it("deleteDomainsBatch invalidates each hierarchy key", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await DomainService.deleteDomainsBatch(["a", "b"])
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domains:all")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domain-hierarchy:a")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domain-hierarchy:b")
    expect(res[0].id).toBe("d2")
  })
})
