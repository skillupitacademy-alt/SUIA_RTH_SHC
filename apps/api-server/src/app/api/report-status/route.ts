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

    // 1. Auth Validation (User Token or Internal Key)
    const internalKey = req.headers.get("x-internal-key");
    const isInternal = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;
    
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

    // 2. Return Status + URL if ready
    const hasFile = typeof report.fileRef === "string" && report.fileRef.trim() !== "";
    if (report.status === "ready" && hasFile) {
      const url = await getDownloadUrl(report.fileRef as string);
      return NextResponse.json(
        { status: "ready", url },
        { headers: { "Cache-Control": "public, max-age=3600, immutable" } }
      );
    }

    // 3. Stall Detection (generating for > 3 mins)
    if (report.status === "generating") {
      const updatedAt =
        report.updatedAt !== null && report.updatedAt !== undefined
          ? new Date(report.updatedAt).getTime()
          : 0;
      const now = Date.now();
      if (now - updatedAt > 3 * 60 * 1000) {
        return NextResponse.json({ 
          status: "failed", 
          error: "Generation stalled. Please retry." 
        });
      }
    }

    return NextResponse.json({ 
      status: report.status,
      stage: report.status === "generating" ? report.errorStage : undefined,
      error: report.status === "failed" ? report.errorStage : undefined
    });

  } catch (error: unknown) {
    logger.error({ err: error }, "[ReportStatus] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
