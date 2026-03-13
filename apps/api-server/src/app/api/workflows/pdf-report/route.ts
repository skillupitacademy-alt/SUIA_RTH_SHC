import { db, exams } from "@quiz/db";
import { serve } from "@upstash/workflow/nextjs";
import { eq } from "drizzle-orm";

import { logger } from "@/lib/logger";
import { uploadReport } from "@/lib/storage/upload-report";
import { withLogging } from "@/lib/withLogging";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const dynamic = "force-dynamic";

const { POST: workflowHandler } = serve<{ attemptId: string; userId: string }>(async (context) => {
  const { attemptId, userId } = context.requestPayload;

  if (typeof attemptId !== "string" || attemptId.trim() === "") {
    throw new Error("Missing attemptId");
  }
  if (typeof userId !== "string" || userId.trim() === "") {
    throw new Error("Missing userId");
  }

  logger.info({ attemptId }, "[PDF Workflow] Starting PDF generation");

  try {
    const renderResult = await context.run("render", async () => {
      await ReportRepository.updateReportStatus(attemptId, "generating", "rendering");
      return ReportPdfService.generate(attemptId);
    });

    const uploadResult = await context.run("upload", async () => {
      await ReportRepository.updateReportStatus(attemptId, "generating", "uploading");
      const fileRef = await uploadReport(renderResult.buffer, userId, attemptId);
      return { ...renderResult, fileRef };
    });

    await context.run("finalize", async () => {
      await ReportRepository.updateReportSuccess(attemptId, {
        fileRef: uploadResult.fileRef,
        generationTimeMs: uploadResult.generationTimeMs,
        fileSizeKb: uploadResult.fileSizeKb,
        pageCount: uploadResult.pageCount
      });

      const examRow = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { exportUrls: true }
      });
      const nextExportUrls = {
        ...(examRow?.exportUrls ?? {}),
        analytics_pdf: uploadResult.fileRef
      };
      await db.update(exams).set({ exportUrls: nextExportUrls }).where(eq(exams.id, attemptId));
    });

    logger.info({ attemptId }, "[PDF Workflow] PDF generation completed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: error, attemptId }, "[PDF Workflow] PDF generation failed");
    await ReportRepository.updateReportStatus(attemptId, "failed", message);
    throw error;
  }
});

export const POST = withLogging(workflowHandler, { component: "workflow", operation: "pdf_report" });
