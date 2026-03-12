import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { badRequest, forbidden, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { getDownloadUrl } from "@/lib/storage/get-download-url";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';
import { ExamRepository } from "@/modules/exam-engine/repositories/exam.repository";
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
      const examRepo = container.get(ExamRepository);
      const exam = await examRepo.findById(attemptId);
      
      if (exam !== undefined && exam !== null) {
        // Map exam status to a pseudo-report status to keep frontend polling alive
        const statusMap: Record<string, string> = {
          'started': 'generating',
          'processing': 'generating',
          'completed': 'not_found',
          'failed': 'failed',
          'abandoned': 'failed'
        };

        return ApiResponse.success({ 
          status: statusMap[exam.status] || 'generating',
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
        const url = await getDownloadUrl(report.fileRef as string);
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

    if (report.status === "generating") {
      const updatedAt =
        report.updatedAt !== null && report.updatedAt !== undefined
          ? new Date(report.updatedAt).getTime()
          : 0;
      const now = Date.now();
      if (now - updatedAt > 3 * 60 * 1000) {
        recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'stalled' });
        return ApiResponse.success({ 
          status: "failed", 
          error: "Generation stalled. Please retry." 
        });
      }
    }

    recordCounter(METRICS.REPORTS.VIEW, 1, { status: report.status });
    return ApiResponse.success({ 
      status: report.status,
      stage: report.status === "generating" ? report.errorStage : undefined,
      error: report.status === "failed" ? report.errorStage : undefined
    }, 200, { "Cache-Control": "no-store" });

  } catch (error: unknown) {
    logger.error({ err: error }, "[ReportStatus] API Error");
    recordTimer(METRICS.REPORTS.VIEW + '.duration', Date.now() - start, { outcome: 'error' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'reports', operation: 'get_report_status' });
