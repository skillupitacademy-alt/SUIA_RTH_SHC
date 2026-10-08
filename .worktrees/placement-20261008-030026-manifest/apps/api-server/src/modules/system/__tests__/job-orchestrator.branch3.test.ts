import { describe, it, expect, vi, beforeEach } from "vitest"

import { JobOrchestrator } from "../job-orchestrator"
import { JobsService } from "../jobs.service"

vi.mock("../jobs.service", () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn(),
    simulateJob: vi.fn(),
  },
}))

const mockJobs = JobsService as unknown as {
  getJob: ReturnType<typeof vi.fn>
  updateJobStatus: ReturnType<typeof vi.fn>
  simulateJob: ReturnType<typeof vi.fn>
}

describe("JobOrchestrator remaining branches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns when job not found", async () => {
    mockJobs.getJob.mockResolvedValue(undefined)
    await JobOrchestrator.runJob("missing", "user")
    expect(mockJobs.updateJobStatus).not.toHaveBeenCalled()
  })

  it("warns when job not pending", async () => {
    mockJobs.getJob.mockResolvedValue({ id: "j", userId: "u", status: "completed", type: "mock", payload: {} })
    await JobOrchestrator.runJob("j", "u")
    expect(mockJobs.updateJobStatus).not.toHaveBeenCalled()
  })
})
