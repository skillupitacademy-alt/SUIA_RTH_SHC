import { describe, it, expect, vi, beforeEach } from "vitest"

import { JobOrchestrator } from "../job-orchestrator"
import { JobsService } from "../jobs.service"
import { resilienceManager } from "@/modules/core/resilience.manager"
import { JobStatus, JobType } from "@quiz/types"

vi.mock("../jobs.service", () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn(),
    simulateJob: vi.fn(),
  },
}))

vi.mock("@/modules/core/resilience.manager", () => ({
  resilienceManager: {
    isHighLoad: vi.fn().mockReturnValue(false),
  },
}))

const mockJobs = JobsService as unknown as {
  getJob: ReturnType<typeof vi.fn>
  updateJobStatus: ReturnType<typeof vi.fn>
  simulateJob: ReturnType<typeof vi.fn>
}

describe("JobOrchestrator additional branches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(resilienceManager.isHighLoad as any).mockReturnValue(false)
  })

  it("drops analytics refresh when high load", async () => {
    (resilienceManager.isHighLoad as any).mockReturnValue(true)
    mockJobs.getJob.mockResolvedValue({
      id: "j1",
      userId: "u1",
      status: "pending",
      type: JobType.ANALYTICS_REFRESH,
      payload: {},
    })
    mockJobs.updateJobStatus.mockResolvedValue({})

    await JobOrchestrator.runJob("j1", "u1")

    expect(mockJobs.updateJobStatus).toHaveBeenCalledWith("j1", JobStatus.FAILED, {
      error: expect.stringContaining("deferred"),
    })
  })

  it("marks unknown job type as failed", async () => {
    mockJobs.getJob.mockResolvedValue({
      id: "j2",
      userId: "u1",
      status: "pending",
      type: "weird" as any,
      payload: {},
    })
    mockJobs.updateJobStatus.mockResolvedValue({})

    await JobOrchestrator.runJob("j2", "u1")

    expect(mockJobs.updateJobStatus).toHaveBeenCalledWith(
      "j2",
      JobStatus.FAILED,
      expect.objectContaining({ error: expect.stringContaining("Unknown job type") })
    )
  })
})
