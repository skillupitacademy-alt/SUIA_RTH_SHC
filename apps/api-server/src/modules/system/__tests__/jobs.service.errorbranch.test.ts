import { describe, it, expect, vi } from "vitest"

import { JobsService } from "../jobs.service"

const failingDb = {
  update: vi.fn(() => ({
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockRejectedValue(new Error("db fail")),
  })),
  insert: vi.fn(() => ({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockRejectedValue(new Error("db fail")) })),
  query: { backgroundJobs: { findFirst: vi.fn() } },
} as any

describe("JobsService error branches", () => {
  it("updateJobStatus propagates db failure", async () => {
    const svc = JobsService.withDb(failingDb as any)
    await expect(svc.updateJobStatus("id", "completed" as any)).rejects.toThrow(/db fail/)
  })

  it("createJob propagates db failure", async () => {
    const svc = JobsService.withDb(failingDb as any)
    await expect(svc.createJob({ userId: "u", type: "report", payload: {} } as any)).rejects.toThrow(/db fail/)
  })
})
