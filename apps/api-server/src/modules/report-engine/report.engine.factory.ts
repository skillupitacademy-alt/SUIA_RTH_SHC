import { db as dbDefault } from "@quiz/db";

import { ReportEngine } from "./report.engine";

// Minimal factory to allow injecting db in tests without touching runtime imports
export const createReportEngine = (deps: { db?: typeof dbDefault } = {}) => {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined) {
    (ReportEngine as unknown as { _db: typeof dbDefault })._db = deps.db ?? dbDefault;
  }
  return ReportEngine;
};
