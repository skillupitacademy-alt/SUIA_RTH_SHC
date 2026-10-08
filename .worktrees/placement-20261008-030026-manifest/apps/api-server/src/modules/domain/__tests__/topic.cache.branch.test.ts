import { describe, it, expect, vi, beforeEach } from "vitest"

import { TopicService } from "../domain.service"
import { cacheService } from "@/modules/core/cache.service"
import { db } from "@quiz/db"

vi.mock("@/modules/core/cache.service", () => ({
  cacheService: {
    del: vi.fn(),
  },
}))

vi.mock("@quiz/db", () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "t-new" }]) })),
    update: vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "t-up" }]) })),
  },
  topics: { id: "tid", subjectId: "sid" },
}))

const mockCache = cacheService as any
const mockDb = db as any

describe("TopicService cache invalidation branches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("createTopic deletes subject topics cache when subjectId present", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await TopicService.createTopic({ subjectId: "sid" } as any)
    expect(mockCache.del).toHaveBeenCalledWith("metadata:topics:subject:sid")
    expect(res[0].id).toBe("t-new")
  })

  it("updateTopic deletes subject topics cache when subjectId present", async () => {
    mockCache.del.mockResolvedValue(undefined)
    const res = await TopicService.updateTopic("tid", { subjectId: "sid" })
    expect(mockCache.del).toHaveBeenCalledWith("metadata:topics:subject:sid")
    expect(res[0].id).toBe("t-up")
  })
})
