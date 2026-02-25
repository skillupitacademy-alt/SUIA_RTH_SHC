import { db, reports } from "@quiz/db";
import { and, eq, lt, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * Sweep Stuck Reports
 * Operational cleanup endpoint to mark reports stuck in 'generating' for > 5 mins
 * as 'failed' so the user can retry.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Security: Internal API Key Required
    const internalKeyHeader = req.headers.get("x-internal-key") ?? "";
    const internalSecret = process.env.INTERNAL_API_KEY;
    const missingSecret = typeof internalSecret !== "string" || internalSecret.length === 0;

    if (missingSecret || internalKeyHeader !== internalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Configurable Threshold
    const thresholdMs = parseInt(process.env.REPORT_STUCK_THRESHOLD_MS ?? "300000", 10);
    const staleAt = new Date(Date.now() - thresholdMs);

    // 2. Find and Update "Zombie" Reports
    // We target 'pending' or 'generating' reports that haven't been updated in threshold
    const stuckReports = await db
      .update(reports)
      .set({
        status: "failed",
        errorStage: `[System Timeout] Generation exceeded ${thresholdMs / 1000}s threshold. Please retry.`,
        updatedAt: new Date(),
      })
      .where(
        and(
          or(eq(reports.status, "generating"), eq(reports.status, "pending")),
          lt(reports.updatedAt, staleAt)
        )
      )
      .returning({
        attemptId: reports.attemptId,
      });

    logger.info({ 
      event: "sweeper_run", 
      cleaned: stuckReports.length, 
      age_ms: thresholdMs,
      reports: stuckReports.map(r => r.attemptId)
    }, "[Sweeper] Stuck reports cleaned up");

    return NextResponse.json({
      success: true,
      cleanedUpCount: stuckReports.length,
      reports: stuckReports.map(r => r.attemptId),
    });
  } catch (error) {
    logger.error({ err: error }, "[Sweeper] API Error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Support GET for manual testing/easier cron triggering if needed 
// (though POST is safer for state changes)
export async function GET(req: NextRequest) {
  return POST(req);
}
