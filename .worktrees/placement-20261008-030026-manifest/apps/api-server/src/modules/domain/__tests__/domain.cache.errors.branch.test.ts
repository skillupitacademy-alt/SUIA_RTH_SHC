import { describe, it, expect, vi, beforeEach } from "vitest"

import { DomainService, SubjectService, TopicService } from "../domain.service"
import { cacheService } from "@/modules/core/cache.service"
import { db } from "@quiz/db"

const mockCache = cacheService as unknown as {
  get: any
  set: any
  del: any
}

const mockDb = db as unknown as any

describe("DomainService cache/error branches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCache.get = vi.fn()
    mockCache.set = vi.fn()
    mockCache.del = vi.fn()
    mockDb.query = {
      domains: { findMany: vi.fn(), findFirst: vi.fn() },
      subjects: { findMany: vi.fn() },
      topics: { findMany: vi.fn() },
    }
    mockDb.delete = vi.fn()
  })

  it("returns cached domains when cache hit", async () => {
    mockCache.get.mockResolvedValue([{ id: "d1" }])
    const res = await DomainService.getAllDomains()
    expect(res).toEqual([{ id: "d1" }])
    expect(mockCache.get).toHaveBeenCalledWith("metadata:domains:all")
    expect(mockDb.query.domains.findMany).not.toHaveBeenCalled()
  })

  it("returns DB domains when cache get throws and caches result", async () => {
    mockCache.get.mockRejectedValue(new Error("redis down"))
    mockDb.query.domains.findMany.mockResolvedValue([{ id: "d2" }])
    mockCache.set.mockResolvedValue(undefined)

    const res = await DomainService.getAllDomains()
    expect(res).toEqual([{ id: "d2" }])
    expect(mockCache.set).toHaveBeenCalledWith("metadata:domains:all", [{ id: "d2" }], expect.any(Number))
  })

  it("deleteSubject invalidates domain cache", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const returning = vi.fn().mockResolvedValue([{ id: "s1" }])
    const where = vi.fn().mockReturnValue({ returning })
    mockDb.delete.mockReturnValueOnce({ where, returning })

    const res = await SubjectService.deleteSubject("s1")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domains:all")
    expect(where).toHaveBeenCalled()
    expect(res).toEqual([{ id: "s1" }])
  })

  it("deleteTopic batch invalidates topics cache entries", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const returning = vi.fn().mockResolvedValue([{ id: "t1" }])
    const where = vi.fn().mockReturnValue({ returning })
    mockDb.delete.mockReturnValueOnce({ where, returning })

    const res = await TopicService.deleteTopicsBatch(["t1", "t2"])
    expect(where).toHaveBeenCalled()
    expect(res).toEqual([{ id: "t1" }])
  })
})
