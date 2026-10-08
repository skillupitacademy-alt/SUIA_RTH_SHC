import { describe, it, expect, vi } from "vitest";
import { JobOrchestrator } from "../job-orchestrator";
import { JobStatus, JobType } from "@quiz/types";

vi.mock("../jobs.service", () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn(),
    simulateJob: vi.fn(),
  },
}));

vi.mock("@/modules/core/resilience.manager", () => ({
  resilienceManager: { isHighLoad: vi.fn().mockReturnValue(false) },
}));

import { JobsService } from "../jobs.service";

describe("JobOrchestrator unknown job type", () => {
  it("marks job failed on unknown type", async () => {
    (JobsService.getJob as any).mockResolvedValue({
      id: "j-unknown",
      userId: "u1",
      type: "WEIRD",
      status: "pending",
      payload: {},
    });

    await JobOrchestrator.runJob("j-unknown", "u1");
    expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
      "j-unknown",
      JobStatus.FAILED,
      expect.objectContaining({ error: expect.stringContaining("Unknown job type") })
    );
  });
});
