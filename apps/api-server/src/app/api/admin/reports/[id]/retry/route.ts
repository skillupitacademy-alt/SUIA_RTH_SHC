import { after, NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { uploadReport } from "@/lib/storage/upload-report";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

/**
 * Admin Report Retry — Reset a failed/stuck report and re-trigger generation.
 * Protected by x-internal-key.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    logger.info({ attemptId, previousStatus: report.status }, "[AdminRetry] Report reset to pending");
    metrics.increment("admin.report_retry", { attemptId });

    // Re-trigger generation in the background
    const userId = report.userId;

    after(async () => {
      try {
        const startTime = Date.now();
        logger.info({ attemptId }, "[AdminRetry] Starting PDF re-generation");

        // Stage 1: Rendering
        await ReportRepository.updateReportStatus(attemptId, "generating", "rendering");
        const { buffer, generationTimeMs, fileSizeKb, pageCount } = 
          await ReportPdfService.generate(attemptId);

        const renderDuration = Date.now() - startTime;
        metrics.timing("report.render_duration", renderDuration, { attemptId, source: "admin_retry" });

        // Stage 2: Uploading
        await ReportRepository.updateReportStatus(attemptId, "generating", "uploading");
        const uploadStart = Date.now();
        const fileRef = await uploadReport(buffer, userId, attemptId);
        const uploadDuration = Date.now() - uploadStart;
        metrics.timing("report.upload_duration", uploadDuration, { attemptId, source: "admin_retry" });

        await ReportRepository.updateReportSuccess(attemptId, {
          fileRef,
          generationTimeMs,
          fileSizeKb,
          pageCount,
        });

        const totalDuration = Date.now() - startTime;
        metrics.timing("report.total_duration", totalDuration, { attemptId, source: "admin_retry", fileSizeKb });

        logger.info({ attemptId, totalDuration }, "[AdminRetry] PDF re-generation successful");
      } catch (err) {
        logger.error({ err, attemptId }, "[AdminRetry] Background re-generation failed");
        const msg = err instanceof Error ? err.message : "Unknown error";
        await ReportRepository.updateReportStatus(attemptId, "failed", msg).catch(() => {});
      }
    });

    return NextResponse.json({ 
      success: true, 
      attemptId, 
      message: "Report queued for re-generation" 
    });
  } catch (error) {
    logger.error({ err: error }, "[AdminRetry] API Error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
