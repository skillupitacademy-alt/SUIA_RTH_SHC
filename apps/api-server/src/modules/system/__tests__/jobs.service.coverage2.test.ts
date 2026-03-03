import { describe, it, expect, vi } from "vitest"

import { JobsService } from "../jobs.service"

const mockDb = {
  delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
  select: vi.fn(() => ({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]) })),
  query: {
    backgroundJobs: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
} as any

describe("JobsService delete/getActive branches", () => {
  it("deleteJob hits delete path", async () => {
    const svc = JobsService.withDb(mockDb as any)
    await svc.deleteJob("j-del", "u1")
    expect(mockDb.delete).toHaveBeenCalled()
  })

  it("getActiveJobCount returns length", async () => {
    const svc = JobsService.withDb(mockDb as any)
    const count = await svc.getActiveJobCount("u1")
    expect(count).toBe(2)
  })
})
