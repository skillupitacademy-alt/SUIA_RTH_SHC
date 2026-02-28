import { METRICS } from "@quiz/observability";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { getDownloadUrl } from "@/lib/storage/get-download-url";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId") ?? "";

    if (attemptId === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    const internalKey = req.headers.get("x-internal-key");
    const internalSecret = process.env.INTERNAL_API_KEY ?? "";
    const isInternal = internalKey !== null && internalSecret !== "" && internalKey === internalSecret;
    
    let userId: string | undefined;

    if (!isInternal) {
      const token = TokenService.getAccessToken(req, { scope: "user" });
      if (token == null || token === "") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      
      const payload = await TokenService.verifyAccessToken(token, false);
      userId = payload.userId;
    }

    const report = await ReportRepository.getReportByAttempt(attemptId);

    if (!report) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    if (!isInternal && report.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const hasFile = typeof report.fileRef === "string" && report.fileRef.trim() !== "";
    if (report.status === "ready" && hasFile) {
      const { storage } = await import("@/lib/storage");
      const exists = await storage.exists(report.fileRef as string);

      if (exists) {
        const url = await getDownloadUrl(report.fileRef as string);
        recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'success', status: 'ready' });
        return NextResponse.json(
          { status: "ready", url },
          { headers: { "Cache-Control": "no-store" } }
        );
      } else {
        recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'failure', reason: 'missing_storage' });
        return NextResponse.json({ status: "not_found" }, { status: 404 });
      }
    }

    if (report.status === "generating") {
      const updatedAt =
        report.updatedAt !== null && report.updatedAt !== undefined
          ? new Date(report.updatedAt).getTime()
          : 0;
      const now = Date.now();
      if (now - updatedAt > 3 * 60 * 1000) {
        recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'stalled' });
        return NextResponse.json({ 
          status: "failed", 
          error: "Generation stalled. Please retry." 
        });
      }
    }

    recordCounter(METRICS.REPORTS.VIEW, 1, { status: report.status });
    return NextResponse.json({ 
      status: report.status,
      stage: report.status === "generating" ? report.errorStage : undefined,
      error: report.status === "failed" ? report.errorStage : undefined
    }, { headers: { "Cache-Control": "no-store" } });

  } catch (error: unknown) {
    logger.error({ err: error }, "[ReportStatus] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordTimer(METRICS.REPORTS.VIEW + '.duration', Date.now() - start, { outcome: 'error' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'reports', operation: 'get_report_status' });
