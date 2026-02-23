import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getDownloadUrl } from "@/lib/storage/get-download-url";
import { TokenService } from "@/modules/auth/token.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId") ?? "";

    if (attemptId === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // 1. Ownership Validation
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token == null || token === "") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const report = await ReportRepository.getReportByAttempt(attemptId);

    if (!report) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    if (report.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Return Status + URL if ready
    if (report.status === "ready" && report.fileRef != null && report.fileRef !== "") {
      const url = await getDownloadUrl(report.fileRef);
      return NextResponse.json(
        { status: "ready", url },
        { headers: { "Cache-Control": "public, max-age=3600, immutable" } }
      );
    }

    return NextResponse.json({ status: report.status });

  } catch (error: unknown) {
    logger.error({ err: error }, "[ReportStatus] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
