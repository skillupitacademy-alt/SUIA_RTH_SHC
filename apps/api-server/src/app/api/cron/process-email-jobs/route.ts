import { NextRequest, NextResponse } from "next/server";

import { processEmailJobs } from "@/workers/email.worker";

export const dynamic = "force-dynamic";

/**
 * TRIGGER PENDING EMAIL JOBS
 * GET /api/cron/process-email-jobs
 * Protected by CRON_SECRET header
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    // Security check: Match header against env var
    if (typeof cronSecret !== "string" || cronSecret.length === 0 || authHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const processed = await processEmailJobs();

    return NextResponse.json({
      success: true,
      processed: processed ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cron job failed";
    console.error("[CRON] process-email-jobs failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
