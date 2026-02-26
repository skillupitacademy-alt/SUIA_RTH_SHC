import { db, exams } from "@quiz/db";
import { eq } from "drizzle-orm";
import { after, NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { uploadReport } from "@/lib/storage/upload-report";
import { TokenService } from "@/modules/auth/token.service";
import { cacheService } from "@/modules/core/cache.service";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = await req.json().catch(() => ({} as unknown));
    const body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

    const attemptFromBody = typeof body.attemptId === "string" ? body.attemptId : "";
    const attemptFromParams = searchParams.get("id") ?? searchParams.get("attemptId") ?? "";
    const attemptId = (attemptFromBody || attemptFromParams).trim();
    const force = body.force === true || searchParams.get("force") === "true";

    if (attemptId === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // 1. Auth Validation (User Token or Internal Key)
    const internalKeyHeader = req.headers.get("x-internal-key") ?? "";
    const internalSecret = process.env.INTERNAL_API_KEY;
    
    if (typeof internalSecret !== "string" || internalSecret.length === 0) {
      logger.error("[QueueReport] INTERNAL_API_KEY is not configured in environment");
      return NextResponse.json({ error: "System configuration error" }, { status: 500 });
    }

    const isInternal = internalKeyHeader === internalSecret;
    
    let userId: string;

    if (isInternal) {
      const examMatch = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true, status: true }
      });
      if (!examMatch) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      userId = examMatch.userId;
    } else {
      const token = TokenService.getAccessToken(req, { scope: "user" });
      if (token == null || token === "") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      
      const payload = await TokenService.verifyAccessToken(token, false);
      userId = payload.userId;

      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true, status: true }
      });

      if (!exam) {
        return NextResponse.json(
          { error: "Exam not found", reason: "not_found", attemptId },
          { status: 404 }
        );
      }

      if (exam.userId !== userId) {
        return NextResponse.json(
          { error: "Exam does not belong to this user", reason: "ownership_mismatch", attemptId },
          { status: 403 }
        );
      }

      if (exam.status !== "completed") {
        return NextResponse.json(
          { error: "Exam is not completed", reason: "not_completed", attemptId },
          { status: 400 }
        );
      }
    }

    // 2. Proactive Rate Limit check (3 per min)
    const { count, ttlRem } = await cacheService.increment(`ratelimit:pdf:${userId}`, 60000);
    if (count > 3) {
      return NextResponse.json({ 
        error: "Rate limit exceeded", 
        retryAfter: ttlRem,
        message: `Limit reached. Next report available in ${ttlRem} seconds.`
      }, { status: 429 });
    }

    // 3. Concurrency Guard with Stale-Job Recovery
    const existingReport = await ReportRepository.getReportByAttempt(attemptId);
    if (existingReport && (existingReport.status === "pending" || existingReport.status === "generating")) {
      const updatedAt = existingReport.updatedAt instanceof Date
        ? existingReport.updatedAt.getTime()
        : new Date(existingReport.updatedAt ?? 0).getTime();
      const staleDuration = Date.now() - updatedAt;
      const STALE_THRESHOLD_MS = 30 * 1000; // 30 seconds

      if (staleDuration < STALE_THRESHOLD_MS && !force) {
        // Genuinely in-flight — don't duplicate
        logger.info({ attemptId, status: existingReport.status, staleDuration }, "[QueueReport] Duplicate job ignored");
        return NextResponse.json({ status: "queued", attemptId, message: "Generation already in progress" });
      }

      // Stale job detected — reset and allow re-trigger below
      logger.warn({ attemptId, status: existingReport.status, staleDuration }, "[QueueReport] Stale job detected, resetting to pending");
      await ReportRepository.updateReportStatus(attemptId, "pending", undefined);
    }

    // 4. State Machine Init
    await ReportRepository.createReportIfNotExists({ attemptId, userId, status: "pending" });

    // 5. Direct inline generation inside after() — no fragile internal HTTP call
    after(async () => {
      try {
        const startTime = Date.now();
        logger.info({ attemptId }, "[QueueReport] Starting direct PDF generation");
        
        // Stage 1: Rendering
        await ReportRepository.updateReportStatus(attemptId, "generating", "rendering");
        const { buffer, generationTimeMs, fileSizeKb, pageCount } = 
          await ReportPdfService.generate(attemptId);
        
        const renderDuration = Date.now() - startTime;
        metrics.timing("report.render_duration", renderDuration, { attemptId });

        // Stage 2: Uploading
        await ReportRepository.updateReportStatus(attemptId, "generating", "uploading");
        const uploadStart = Date.now();
        const fileRef = await uploadReport(buffer, userId, attemptId);
        const uploadDuration = Date.now() - uploadStart;
        metrics.timing("report.upload_duration", uploadDuration, { attemptId });

        await ReportRepository.updateReportSuccess(attemptId, {
          fileRef,
          generationTimeMs,
          fileSizeKb,
          pageCount
        });

        const totalDuration = Date.now() - startTime;
        metrics.timing("report.total_duration", totalDuration, { attemptId, fileSizeKb });

        logger.info({ 
          attemptId, 
          fileSizeKb, 
          generationTimeMs, 
          renderDuration, 
          uploadDuration,
          totalDuration 
        }, "[QueueReport] PDF generation successful");
      } catch (err) {
        logger.error({ err, attemptId }, "[QueueReport] Background generation failed");
        const msg = err instanceof Error ? err.message : "Unknown error";
        await ReportRepository.updateReportStatus(attemptId, "failed", msg).catch(() => {});
      }
    });

    return NextResponse.json({ status: "queued", attemptId });

  } catch (error: unknown) {
    logger.error({ err: error }, "[QueueReport] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
