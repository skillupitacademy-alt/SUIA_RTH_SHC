import { db, exams } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { ExportEngine } from "@/lib/export/exportEngine";
import type { ExportMeta, ExportPayload, RawAttemptRow } from "@/lib/export/exportTypes";
import { StudentInsightFormatter } from "@/lib/export/formatters/studentInsightFormatter";
import { logger } from "@/lib/logger";
import { recordCounter } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { getDownloadUrl } from "@/lib/storage/get-download-url";
import { uploadReport } from "@/lib/storage/upload-report";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { cacheService } from "@/modules/core/cache.service";
import { container } from '@/modules/core/container';
import { PremiumReport, ReportEngine } from "@/modules/report-engine/report.engine";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = await req.json().catch(() => ({} as unknown));
    const body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

    const attemptIdParam = body.attemptId ?? searchParams.get("id");
    const attemptId = (typeof attemptIdParam === "string" ? attemptIdParam : "").trim();
    
    if (attemptId === "") throw badRequest("Missing attemptId");

    // Auth logic (mirrored from generate-report)
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined) throw unauthorized("Unauthorized");
    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (payload?.userId === null || payload?.userId === undefined) throw unauthorized("Unauthorized");
    const userId = payload.userId;

    const examRows = await db.select({ userId: exams.userId, status: exams.status, exportUrls: exams.exportUrls })
      .from(exams)
      .where(eq(exams.id, attemptId))
      .limit(1);
    const exam = examRows[0];
    if (exam === undefined) throw notFound("Exam", attemptId);
    if (exam.userId !== userId) throw forbidden("Unauthorized");
    if (exam.status !== "completed") throw badRequest("Exam is not completed");

    // Rate limiting (mirrored)
    const { count } = await cacheService.increment(`ratelimit:pdf:insight:${userId}`, 60000);
    if (count > 5) return ApiResponse.error(new Error("Rate limit exceeded"), 429);

    // Generation Lock
    const lockKey = `lock:pdf:insight:${attemptId}`;
    const acquired = await redis.set(lockKey, "1", { nx: true, ex: 120 });
    if (acquired === null) return ApiResponse.success({ status: "generating", message: "Already in progress" });

    try {
      // 1. Fetch Data for Formatter
      const exportEngine = ExportEngine.getInstance();
      const reportEngine = container.get(ReportEngine);
      
      const [meta, currentRows, historicalRows, premiumReport]: [ExportMeta, RawAttemptRow[], RawAttemptRow[], PremiumReport] = await Promise.all([
        exportEngine.queryBuilder.fetchUserMeta(attemptId),
        exportEngine.queryBuilder.fetchRawAttempts(attemptId),
        exportEngine.queryBuilder.fetchHistoricalAttempts(userId, attemptId),
        reportEngine.getPremiumExamReport(attemptId)
      ]);

      const exportPayload: ExportPayload = {
        meta,
        rawAttempts: currentRows,
        aggregations: await exportEngine.aggregator.buildAggregations(currentRows),
        historicalProgress: await exportEngine.aggregator.buildHistoricalProgress(historicalRows),
        guidanceSignals: exportEngine.aggregator.buildGuidanceSignals(currentRows, historicalRows)
      };

      const formatter = new StudentInsightFormatter();
      const insightData = formatter.format(exportPayload, premiumReport);

      // 2. Generate PDF targeting the new template
      const { buffer } = await ReportPdfService.getInstance().generate(
        attemptId,
        undefined,
        undefined,
        undefined,
        undefined,
        { 
          customPath: `/report/${attemptId}/student-insight`,
          customData: insightData 
        }
      );

      // 3. Upload & Store
      const fileRef = await uploadReport(buffer, userId, attemptId);
      
      // Update exams.export_urls
      const currentUrls = (exam.exportUrls as Record<string, string> | null) || {};
      await db.update(exams)
        .set({ 
          exportUrls: { 
            ...currentUrls, 
            student_insight_pdf: fileRef 
          } 
        })
        .where(eq(exams.id, attemptId));

      const url = await getDownloadUrl(fileRef);
      recordCounter(METRICS.REPORTS.PDF_GEN, 1, { type: 'student_insight', outcome: 'success' });
      
      return ApiResponse.success({ url, cached: false });

    } finally {
      await redis.del(lockKey).catch(() => {});
    }

  } catch (error: unknown) {
    logger.error({ err: error }, "[StudentInsightPDF] Error");
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'reports', operation: 'generate_student_insight_pdf' });
