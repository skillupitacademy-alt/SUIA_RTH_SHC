import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobStatus } from "@quiz/types";

let mockDb: any = {};

vi.mock("@quiz/db", () => ({
  get db() {
    return mockDb;
  },
  backgroundJobs: { id: "id" },
}));

import { JobsService } from "../jobs.service";

describe("JobsService updateJobStatus branches", () => {
  beforeEach(() => {
    mockDb = {
      update: vi.fn(),
    };
    (JobsService as any)._db = mockDb;
  });

  it("sets completedAt when marking completed", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "j1", status: JobStatus.COMPLETED }]);
    mockDb.update.mockReturnValue({ set: () => ({ where: () => ({ returning }) }) });

    const res = await JobsService.updateJobStatus("j1", JobStatus.COMPLETED, { result: { ok: true } });
    expect(res.status).toBe(JobStatus.COMPLETED);
    expect(returning).toHaveBeenCalled();
  });

  it("sets startedAt when marking processing", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "j2", status: JobStatus.PROCESSING }]);
    mockDb.update.mockReturnValue({ set: () => ({ where: () => ({ returning }) }) });

    const res = await JobsService.updateJobStatus("j2", JobStatus.PROCESSING);
    expect(res.status).toBe(JobStatus.PROCESSING);
    expect(returning).toHaveBeenCalled();
  });
});
