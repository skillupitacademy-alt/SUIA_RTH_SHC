import { type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { processEmailJobs } from "@/workers/email.worker";

export const dynamic = "force-dynamic";

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const authHeader = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (typeof cronSecret !== "string" || cronSecret.length === 0 || authHeader !== cronSecret) {
      throw unauthorized("Unauthorized");
    }

    const processed = await processEmailJobs();

    recordCounter('cron.process_email_jobs.success', 1);
    const durationMs = Date.now() - start;
    recordTimer('cron.process_email_jobs.duration', durationMs, { outcome: 'success' });
    return ApiResponse.success({
      success: true,
      processed: processed ?? null,
      timestamp: new Date().toISOString(),
    }, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (err) {
    recordCounter('cron.process_email_jobs.failure', 1);
    return ApiResponse.error(err);
  }
}

export const GET = withLogging(getHandler, { component: 'system', operation: 'cron_process_emails' });
