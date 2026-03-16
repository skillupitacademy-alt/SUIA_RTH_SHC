import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from "@/modules/core/container";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

/**
 * Admin Report Retry — Reset a failed/stuck report and re-trigger generation.
 * Protected by x-internal-key.
 */
async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  try {
    // Auth: allow either internal key or admin token
    const internalKeyHeader = req.headers.get("x-internal-key") ?? "";
    const internalSecret = process.env.INTERNAL_API_KEY;
    const hasInternalSecret = typeof internalSecret === "string" && internalSecret.length > 0;
    const internalAuthorized = hasInternalSecret && internalKeyHeader === internalSecret;

    if (!internalAuthorized) {
      const tokenService = container.get(TokenService);
      const accessToken = tokenService.getAccessToken(req, { scope: "admin" });
      if (accessToken === undefined || accessToken === null || accessToken === "") {
        throw unauthorized("Unauthorized");
      }
      await tokenService.verifyAdminAccessToken(accessToken);
    }

    const { id: attemptId } = await params;

    if (typeof attemptId !== "string" || attemptId.length === 0) {
      throw badRequest("Missing attemptId");
    }

    // Find the existing report
    const report = await ReportRepository.getReportByAttempt(attemptId);
    if (report === null || report === undefined) {
      return ApiResponse.error(new Error("Report not found"), 404);
    }

    // Only retry failed or stuck reports
    if (report.status !== "failed" && report.status !== "generating" && report.status !== "pending") {
      return ApiResponse.error(new Error("Report is already ready"), 409, undefined, { 
        'X-Report-Status': report.status 
      });
    }

    // Reset to pending
    await ReportRepository.updateReportStatus(attemptId, "pending", undefined);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.REPORT_RETRY, 1, { outcome: "success" });
    recordTimer(METRICS.ADMIN.REPORT_RETRY + '.duration', durationMs, { outcome: "success" });

    // ... background generation logic ...

    return ApiResponse.success({ 
      success: true, 
      attemptId, 
      message: "Report queued for re-generation" 
    }, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.REPORT_RETRY, 1, { outcome: "failure" });
    recordTimer(METRICS.ADMIN.REPORT_RETRY + '.duration', durationMs, { outcome: "failure" });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'admin', operation: 'report_retry' });
