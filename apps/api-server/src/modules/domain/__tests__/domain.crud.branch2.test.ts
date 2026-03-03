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
    delete: vi.fn(() => ({ where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "d-del" }]) })),
    update: vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "d-up" }]) })),
    insert: vi.fn(() => ({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "d-new" }]) })),
    query: {
      domains: { findMany: vi.fn() },
    },
  },
  domains: { id: "did", status: "active" },
}))

const mockCache = cacheService as any
const mockDb = db as any

describe("DomainService remaining CRUD branches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deleteDomain clears caches", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await DomainService.deleteDomain("did")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domains:all")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domain-hierarchy:did")
    expect(res[0].id).toBe("d-del")
  })

  it("deleteDomainsBatch clears caches per id", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await DomainService.deleteDomainsBatch(["a", "b"])
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domains:all")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domain-hierarchy:a")
    expect(mockCache.del).toHaveBeenCalledWith("metadata:domain-hierarchy:b")
    expect(res[0].id).toBe("d-del")
  })
})
