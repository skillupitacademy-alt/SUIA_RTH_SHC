import { db, exams } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { eq } from "drizzle-orm";
import { after, NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

import { badRequest, forbidden, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { uploadReport } from "@/lib/storage/upload-report";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { cacheService } from "@/modules/core/cache.service";
import { container } from '@/modules/core/container';
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

async function postHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Ingest and sanitize JSON body
    let raw;
    try {
      raw = await req.json();
      validateJsonSize(raw);
      validateJsonDepth(raw);
    } catch {
      raw = {};
    }
    const body = sanitizeJsonField(raw) as Record<string, unknown>;

    const attemptFromBody = typeof body.attemptId === "string" ? body.attemptId : "";
    const attemptFromParams = searchParams.get("id") ?? searchParams.get("attemptId") ?? "";
    const attemptId = (attemptFromBody || attemptFromParams).trim();
    const force = body.force === true || searchParams.get("force") === "true";

    if (attemptId === "") {
      throw badRequest("Missing attemptId");
    }

    // 1. Auth Validation (User Token or Internal Key)
    const internalKeyHeader = req.headers.get("x-internal-key") ?? "";
    const internalSecret = process.env.INTERNAL_API_KEY;
    
    if (typeof internalSecret !== "string" || internalSecret.length === 0) {
      logger.error("[QueueReport] INTERNAL_API_KEY is not configured in environment");
      return ApiResponse.error(new Error("System configuration error"), 500);
    }

    const isInternal = internalKeyHeader === internalSecret;
    
    let userId: string;

    if (isInternal) {
      const examMatch = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true, status: true }
      });
      if (examMatch === null || examMatch === undefined) throw badRequest("Exam not found");
      userId = examMatch.userId;
    } else {
      const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
      if (token === null || token === undefined || token === "") throw unauthorized("Unauthorized");
      
      const payload = await container.get(TokenService).verifyUserAccessToken(token);
      if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
        throw unauthorized("Unauthorized");
      }
      userId = payload.userId;

      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true, status: true }
      });

      if (exam === null || exam === undefined) {
        throw badRequest("Exam not found");
      }

      if (exam.userId !== userId) {
        throw forbidden("Exam does not belong to this user");
      }

      if (exam.status !== "completed") {
        throw badRequest("Exam is not completed");
      }
    }

    // 2. Proactive Rate Limit check (3 per min)
    const { count, ttlRem } = await cacheService.increment(`ratelimit:pdf:${userId}`, 60000);
    if (count > 3) {
      return ApiResponse.error(new Error("Rate limit exceeded"), 429, undefined, {
        'Retry-After': ttlRem.toString(),
        'X-Error-Message': `Limit reached. Next report available in ${ttlRem} seconds.`
      });
    }

    // 3. Concurrency Guard with Stale-Job Recovery
    const existingReport = await ReportRepository.getReportByAttempt(attemptId);
    if (existingReport !== null && existingReport !== undefined && (existingReport.status === "pending" || existingReport.status === "generating")) {
      const updatedAt = existingReport.updatedAt instanceof Date
        ? existingReport.updatedAt.getTime()
        : new Date(existingReport.updatedAt ?? 0).getTime();
      const staleDuration = Date.now() - updatedAt;
      const STALE_THRESHOLD_MS = 30 * 1000; // 30 seconds

      if (staleDuration < STALE_THRESHOLD_MS && !force) {
        // Genuinely in-flight — don't duplicate
        logger.info({ attemptId, status: existingReport.status, staleDuration }, "[QueueReport] Duplicate job ignored");
        return ApiResponse.success({ status: "queued", attemptId, message: "Generation already in progress" });
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
        recordTimer("reports.api.render.duration", renderDuration, { route: "/api/queue-report", outcome: "success" });

        // Stage 2: Uploading
        await ReportRepository.updateReportStatus(attemptId, "generating", "uploading");
        const uploadStart = Date.now();
        const fileRef = await uploadReport(buffer, userId, attemptId);
        const uploadDuration = Date.now() - uploadStart;
        recordTimer("reports.api.upload.duration", uploadDuration, { route: "/api/queue-report", outcome: "success" });

        await ReportRepository.updateReportSuccess(attemptId, {
          fileRef,
          generationTimeMs,
          fileSizeKb,
          pageCount
        });

        const totalDuration = Date.now() - startTime;
        recordTimer("reports.api.total.duration", totalDuration, { route: "/api/queue-report", outcome: "success", fileSizeKb });
        recordCounter("reports.api.queue.count", 1, { route: "/api/queue-report", outcome: "success" });

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
        recordCounter("reports.api.queue.count", 1, { route: "/api/queue-report", outcome: "failure" });
        const msg = err instanceof Error ? err.message : "Unknown error";
        await ReportRepository.updateReportStatus(attemptId, "failed", msg).catch(() => {});
      }
    });

    return ApiResponse.success({ status: "queued", attemptId });

  } catch (error: unknown) {
    logger.error({ err: error }, "[QueueReport] API Error");
    recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'internal_error' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'reports', operation: 'queue_report' });
