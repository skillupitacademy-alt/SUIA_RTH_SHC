import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

import { ApiResponse } from "@/lib/api-response";
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

/**
 * Admin Reports API — List & Stats
 * Protected by x-internal-key.
 */
async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    await requireAdminRouteAccess(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const userId = searchParams.get("userId") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const [reportsList, stats] = await Promise.all([
      ReportRepository.listReports({ status, userId, limit, offset }),
      ReportRepository.getReportStats(),
    ]);

    const durationMs = Date.now() - start;
    recordCounter(METRICS.REPORTS.LIST, 1, { outcome: "success" });
    recordTimer(METRICS.REPORTS.LIST + ".duration", durationMs);

    return ApiResponse.success(
      {
        reports: reportsList,
        stats,
        pagination: { limit, offset, returned: reportsList.length },
      },
      200,
      { "X-Duration-Ms": durationMs.toString() }
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.REPORTS.LIST, 1, { outcome: "failure" });
    recordTimer(METRICS.REPORTS.LIST + ".duration", durationMs, { outcome: "failure" });
    return ApiResponse.error(error);
  }
}

export const GET = withCorrelationId(withLogging(handler, { component: 'admin', operation: 'list_reports' }));
