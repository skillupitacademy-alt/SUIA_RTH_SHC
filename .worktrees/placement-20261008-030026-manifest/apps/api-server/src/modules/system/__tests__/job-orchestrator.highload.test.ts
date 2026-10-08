import { describe, it, expect, vi, beforeEach } from "vitest";

import { JobOrchestrator } from "../job-orchestrator";

vi.mock("@/modules/core/resilience.manager", () => ({
  resilienceManager: {
    isHighLoad: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("../jobs.service", () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn(),
    simulateJob: vi.fn(),
  },
}));

import { resilienceManager } from "@/modules/core/resilience.manager";
import { JobsService } from "../jobs.service";
import { JobStatus, JobType } from "@quiz/types";

describe("JobOrchestrator resilience drop path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails non-critical job when high load", async () => {
    (JobsService.getJob as any).mockResolvedValue({
      id: "j1",
      userId: "u1",
      type: JobType.ANALYTICS_REFRESH,
      status: "pending",
      payload: {},
    });

    await JobOrchestrator.runJob("j1", "u1");

    expect(resilienceManager.isHighLoad).toHaveBeenCalled();
    expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
      "j1",
      JobStatus.FAILED,
      expect.objectContaining({ error: expect.stringContaining("heavy load") })
    );
  });
});
