import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { processEmailJobs } from "@/workers/email.worker";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const authHeader = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (typeof cronSecret !== "string" || cronSecret.length === 0 || authHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const processed = await processEmailJobs();

    recordCounter('cron.process_email_jobs.success', 1);
    recordTimer('cron.process_email_jobs.duration', Date.now() - start, { outcome: 'success' });
    return NextResponse.json({
      success: true,
      processed: processed ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    recordCounter('cron.process_email_jobs.failure', 1);
    const message = err instanceof Error ? err.message : "Cron job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'system', operation: 'cron_process_emails' });
