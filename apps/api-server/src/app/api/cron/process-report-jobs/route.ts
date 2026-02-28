import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { ReportWorker } from "@/services/reports/ReportWorker";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const authHeader = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (typeof cronSecret !== "string" || cronSecret.length === 0 || authHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const processed = await ReportWorker.work(55000);

    recordCounter('cron.process_report_jobs.success', 1);
    recordTimer('cron.process_report_jobs.duration', Date.now() - start, { outcome: 'success' });
    return NextResponse.json({
      success: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    recordCounter('cron.process_report_jobs.failure', 1);
    const message = err instanceof Error ? err.message : "Cron job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'system', operation: 'cron_process_reports' });
