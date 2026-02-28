import { METRICS } from "@quiz/observability";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

/**
 * Admin Report Retry — Reset a failed/stuck report and re-trigger generation.
 * Protected by x-internal-key.
 */
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  try {
    // Auth: Internal API Key Required
    const internalKeyHeader = req.headers.get("x-internal-key") ?? "";
    const internalSecret = process.env.INTERNAL_API_KEY;
    const missingSecret = typeof internalSecret !== "string" || internalSecret.length === 0;

    if (missingSecret || internalKeyHeader !== internalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: attemptId } = await params;

    if (typeof attemptId !== "string" || attemptId.length === 0) {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // Find the existing report
    const report = await ReportRepository.getReportByAttempt(attemptId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only retry failed or stuck reports
    if (report.status !== "failed" && report.status !== "generating" && report.status !== "pending") {
      return NextResponse.json({ 
        error: "Report is already ready", 
        status: report.status 
      }, { status: 409 });
    }

    // Reset to pending
    await ReportRepository.updateReportStatus(attemptId, "pending", undefined);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.REPORT_RETRY, 1, { outcome: "success" });
    recordTimer(METRICS.ADMIN.REPORT_RETRY + '.duration', durationMs, { outcome: "success" });

    // ... background generation logic ...

    return NextResponse.json({ 
      success: true, 
      attemptId, 
      message: "Report queued for re-generation" 
    }, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.REPORT_RETRY, 1, { outcome: "failure" });
    recordTimer(METRICS.ADMIN.REPORT_RETRY + '.duration', durationMs, { outcome: "failure" });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'report_retry' });
