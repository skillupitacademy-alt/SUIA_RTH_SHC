import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { ReportWorker } from "@/services/reports/ReportWorker";

export const dynamic = "force-dynamic";

/**
 * TRIGGER PENDING HIERARCHICAL REPORT JOBS
 * GET /api/cron/process-report-jobs
 * Protected by CRON_SECRET header
 */
export async function GET(req: NextRequest) {
  const log = logger.child({ module: 'cron-process-reports' });
  
  try {
    const authHeader = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    // Security check: Match header against env var
    if (typeof cronSecret !== "string" || cronSecret.length === 0 || authHeader !== cronSecret) {
      log.warn("Unauthorized cron attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.info("Starting report processing cron execution");
    
    // We run for up to 55 seconds to stay within the 60s lambda limit
    const processed = await ReportWorker.work(55000);

    return NextResponse.json({
      success: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cron job failed";
    log.error({ error: message }, "process-report-jobs failed");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
