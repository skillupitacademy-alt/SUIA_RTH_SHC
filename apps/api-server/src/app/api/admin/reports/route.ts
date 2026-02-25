import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

/**
 * Admin Reports API — List & Stats
 * Protected by x-internal-key.
 */
export async function GET(req: NextRequest) {
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

    return NextResponse.json({
      reports: reportsList,
      stats,
      pagination: { limit, offset, returned: reportsList.length },
    });
  } catch (error) {
    logger.error({ err: error }, "[AdminReports] API Error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
