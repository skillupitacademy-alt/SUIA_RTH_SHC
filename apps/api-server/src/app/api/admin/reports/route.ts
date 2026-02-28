import { METRICS } from "@quiz/observability";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

/**
 * Admin Reports API — List & Stats
 * Protected by x-internal-key.
 */
async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    // Auth: Internal API Key Required
    const internalKeyHeader = req.headers.get("x-internal-key") ?? "";
    const internalSecret = process.env.INTERNAL_API_KEY;
    const missingSecret = typeof internalSecret !== "string" || internalSecret.length === 0;

    if (missingSecret || internalKeyHeader !== internalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json(
      {
        reports: reportsList,
        stats,
        pagination: { limit, offset, returned: reportsList.length },
      },
      {
        headers: { "X-Duration-Ms": durationMs.toString() },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordCounter(METRICS.REPORTS.LIST, 1, { outcome: "failure" });
    recordTimer(METRICS.REPORTS.LIST + ".duration", Date.now() - start, { outcome: "failure" });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'admin', operation: 'list_reports' });
