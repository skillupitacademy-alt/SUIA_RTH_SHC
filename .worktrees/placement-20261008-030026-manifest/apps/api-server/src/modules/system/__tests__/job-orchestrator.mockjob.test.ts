import { describe, it, expect, vi, beforeEach } from "vitest"

import { JobOrchestrator } from "../job-orchestrator"
import { JobsService } from "../jobs.service"
import { JobType, JobStatus } from "@quiz/types"

vi.mock("../jobs.service", () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn(),
    simulateJob: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockJobs = JobsService as unknown as {
  getJob: ReturnType<typeof vi.fn>
  updateJobStatus: ReturnType<typeof vi.fn>
  simulateJob: ReturnType<typeof vi.fn>
}

describe("JobOrchestrator MOCK_JOB branch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ALLOW_MOCK_JOBS = "true"
  })

  it("routes MOCK_JOB to simulateJob", async () => {
    mockJobs.getJob.mockResolvedValue({
      id: "mock1",
      userId: "u1",
      status: "pending",
      type: JobType.MOCK_JOB,
      payload: {},
    })
    mockJobs.updateJobStatus.mockResolvedValue({})

    await JobOrchestrator.runJob("mock1", "u1")
    expect(mockJobs.simulateJob).toHaveBeenCalledWith("mock1", "u1")
    expect(mockJobs.updateJobStatus).toHaveBeenCalledWith("mock1", JobStatus.PROCESSING)
  })
})
