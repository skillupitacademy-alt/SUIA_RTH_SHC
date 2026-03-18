import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { badRequest, forbidden, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from "@/modules/core/container";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId") ?? "";

    if (attemptId === "") {
      throw badRequest("Missing attemptId");
    }

    const internalKey = req.headers.get("x-internal-key");
    const internalSecret = process.env.INTERNAL_API_KEY ?? "";
    const isInternal = internalKey !== null && internalSecret !== "" && internalKey === internalSecret;
    
    let userId: string | undefined;

    if (!isInternal) {
      const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
      if (token === undefined || token === null || token === "") {
        throw unauthorized("Unauthorized");
      }
      
      const payload = await container.get(TokenService).verifyUserAccessToken(token);
      userId = payload.userId;
    }

    const report = await ReportRepository.getReportByAttempt(attemptId);

    // Fallback: Check the exams table if no materialized report record exists yet (Task 125)
    if (report === undefined || report === null) {
      // Defensive: avoid relying on DI seams for exam lookup; query directly.
      const { db, exams } = await import("@quiz/db");
      const { eq } = await import("drizzle-orm");
      const examRow = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true, status: true, exportUrls: true }
      });
      
      if (examRow !== undefined && examRow !== null) {
        if (!isInternal && examRow.userId !== userId) {
          throw forbidden("Unauthorized");
        }

        // If the PDF exists in exams.export_urls, return ready (and verify storage exists).
        const exportUrls = examRow.exportUrls as { analytics_pdf?: string } | null;
        const analyticsPdfRef = exportUrls?.analytics_pdf;
        if (typeof analyticsPdfRef === "string" && analyticsPdfRef.trim() !== "") {
          const { storage } = await import("@/lib/storage");
          const exists = await storage.exists(analyticsPdfRef);
          if (exists) {
            const url = buildReportDownloadUrl(attemptId);
            recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'success', status: 'ready', source: 'exams.export_urls' });
            return ApiResponse.success({ status: "ready", url }, 200, { "Cache-Control": "no-store" });
          }
          // Stale pointer: treat as not found (caller can regenerate).
          recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'failure', reason: 'missing_storage', source: 'exams.export_urls' });
        }

        // Map exam status to a pseudo-report status to keep frontend polling alive
        const statusMap: Record<string, string> = {
          'started': 'generating',
          'processing': 'generating',
          'completed': 'not_found',
          'failed': 'failed',
          'abandoned': 'failed'
        };

        return ApiResponse.success({ 
          status: statusMap[examRow.status] || 'generating',
          isLegacyFallback: true 
        }, 200, { "Cache-Control": "no-store" });
      }

      return ApiResponse.success({ status: "not_found" }, 404);
    }

    if (!isInternal && report.userId !== userId) {
      throw forbidden("Unauthorized");
    }

    const hasFile = typeof report.fileRef === "string" && report.fileRef.trim() !== "";
    if (report.status === "ready" && hasFile) {
      const { storage } = await import("@/lib/storage");
      const exists = await storage.exists(report.fileRef as string);

      if (exists) {
        const url = buildReportDownloadUrl(attemptId);
        recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'success', status: 'ready' });
        return ApiResponse.success(
          { status: "ready", url },
          200,
          { "Cache-Control": "no-store" }
        );
      } else {
        recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'failure', reason: 'missing_storage' });
        return ApiResponse.success({ status: "not_found" }, 404);
      }
    }

    if (report.status === "generating" || report.status === "pending") {
      const updatedAt =
        report.updatedAt !== null && report.updatedAt !== undefined
          ? new Date(report.updatedAt).getTime()
          : 0;
      const now = Date.now();
      if (now - updatedAt > 2 * 60 * 1000) {
        recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'stalled' });
        
        // Auto-fail the stalled job in the database so the frontend can reset
        await ReportRepository.updateReportStatus(attemptId, "failed", "Generation stalled. Please retry.").catch(() => {});
        
        return ApiResponse.success({ 
          status: "failed", 
          error: "Generation stalled. Please retry." 
        });
      }
    }

    recordCounter(METRICS.REPORTS.VIEW, 1, { status: report.status });
    const sanitizedError = report.status === "failed"
      ? sanitizeReportError(report.errorStage)
      : undefined;

    return ApiResponse.success({ 
      status: report.status,
      stage: report.status === "generating" ? report.errorStage : undefined,
      error: sanitizedError
    }, 200, { "Cache-Control": "no-store" });

  } catch (error: unknown) {
    logger.error({ err: error }, "[ReportStatus] API Error");
    recordTimer(METRICS.REPORTS.VIEW + '.duration', Date.now() - start, { outcome: 'error' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'reports', operation: 'get_report_status' });

function sanitizeReportError(message: string | null | undefined): string | undefined {
  if (message === null || message === undefined || message.trim() === "") return message ?? undefined;
  const lowered = message.toLowerCase();
  if (
    lowered.includes("upstash workflow") ||
    lowered.includes("workflowabort") ||
    lowered.includes("disabled-qstash") ||
    lowered.includes("failed to authenticate workflow request")
  ) {
    return "PDF generation failed. Please retry.";
  }
  return message;
}

function buildReportDownloadUrl(attemptId: string) {
  const rawBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (rawBase.trim() === "") {
    return `/api/reports/download?attemptId=${encodeURIComponent(attemptId)}`;
  }
  const base = rawBase.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  return `${base}/api/reports/download?attemptId=${encodeURIComponent(attemptId)}`;
}
