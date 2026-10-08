import { describe, it, expect, vi } from "vitest"

import { JobsService } from "../jobs.service"

const insertChain = () => {
  const returning = vi.fn().mockResolvedValue([{ id: "j1" }])
  const values = vi.fn().mockReturnValue({ returning })
  return { insert: vi.fn().mockReturnValue({ values, returning }), returning, values }
}

const mockDb = () => {
  const i = insertChain()
  return {
    insert: i.insert,
    update: vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: "j1", status: "failed" }]) })),
    delete: vi.fn(() => ({ where: vi.fn().mockReturnThis() })),
    select: vi.fn(() => ({ from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis() })),
    query: {
      backgroundJobs: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  } as any
}

describe("JobsService seams", () => {
  it("propagates db errors during createJob (branch)", async () => {
    const db = mockDb()
    db.insert = vi.fn(() => ({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockRejectedValue(new Error("db down")) }))
    const svc = JobsService.withDb(db as any)
    await expect(svc.createJob({ userId: "u", type: "report", payload: {} } as any)).rejects.toThrow(/db down/)
  })

  it("returns null from getJob when db returns undefined", async () => {
    const db = mockDb()
    db.query.backgroundJobs.findFirst.mockResolvedValue(undefined)
    const svc = JobsService.withDb(db as any)
    const res = await svc.getJob("id", "user")
    expect(res).toBeUndefined()
  })

  it("updateJobStatus sets result/error for completed jobs", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "j2", status: "completed", result: { foo: "bar" }, error: "err" }])
    const where = vi.fn().mockReturnValue({ returning })
    const update = vi.fn(() => ({ set: vi.fn().mockReturnThis(), where }))

    const db = mockDb()
    db.update = update
    const svc = JobsService.withDb(db as any)
    const res = await svc.updateJobStatus("j2", "completed" as any, { result: { foo: "bar" }, error: "err" })
    expect(where).toHaveBeenCalled()
    expect(res.result).toEqual({ foo: "bar" })
  })

  it("listJobs builds where when filters provided", async () => {
    const db = mockDb()
    db.query.backgroundJobs.findMany.mockResolvedValue([{ id: "j3" }])
    db.select.mockReturnValue({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ count: 1 }]) })
    const svc = JobsService.withDb(db as any)
    const res = await svc.listJobs({ userId: "u1", status: "pending" as any })
    expect(db.query.backgroundJobs.findMany).toHaveBeenCalled()
    expect(res.items[0].id).toBe("j3")
  })
})
