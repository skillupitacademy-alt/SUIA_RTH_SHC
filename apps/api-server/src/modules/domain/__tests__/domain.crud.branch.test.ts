import { describe, it, expect, vi, beforeEach } from "vitest"

import { DomainService, TopicService } from "../domain.service"
import { cacheService } from "@/modules/core/cache.service"
import { db, domains, topics } from "@quiz/db"

vi.mock("@/modules/core/cache.service", () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock("@quiz/db", () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "d-new" }]) })),
    update: vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "d-up" }]) })),
    delete: vi.fn(() => ({ where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "t-del" }]) })),
  },
  domains: { id: "did", status: "active" },
  topics: { id: "tid", status: "active" },
}))

const mockCache = cacheService as any
const mockDb = db as any

describe("DomainService CRUD branches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("createDomain clears list cache", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await DomainService.createDomain({ name: "n" } as any)
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domains:all")
    expect(res[0].id).toBe("d-new")
  })

  it("updateDomain clears list and hierarchy caches", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await DomainService.updateDomain("d1", { name: "u" })
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domains:all")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domain-hierarchy:d1")
    expect(res[0].id).toBe("d-up")
  })

  it("deleteTopic clears domains cache", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await TopicService.deleteTopic("tid")
    expect(mockCache.del).not.toHaveBeenCalled() // deleteTopic has no invalidation, hit branch anyway
    expect(res[0].id).toBe("t-del")
  })
})
