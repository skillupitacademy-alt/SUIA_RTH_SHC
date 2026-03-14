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

  const idempotency = await context.run("idempotency-check", async () => {
    const existingReport = await ReportRepository.getReportByAttempt(attemptId);
    if (existingReport?.status === "ready" && typeof existingReport.fileRef === "string" && existingReport.fileRef.trim() !== "") {
      logger.info({ attemptId }, "[PDF Workflow] Idempotency hit via report record");
      return { shortCircuit: true };
    }

    const examRow = await db.query.exams.findFirst({
      where: eq(exams.id, attemptId),
      columns: { exportUrls: true }
    });
    const existingPdfUrl = (examRow?.exportUrls as { analytics_pdf?: string } | null)?.analytics_pdf;
    if (typeof existingPdfUrl === "string" && existingPdfUrl.trim() !== "") {
      logger.info({ attemptId }, "[PDF Workflow] Idempotency hit via exams.export_urls");
      return { shortCircuit: true };
    }

    return { shortCircuit: false };
  });

  if (idempotency.shortCircuit) return;

  const uploadResult = await context.run("render-and-upload", async () => {
    await ReportRepository.updateReportStatus(attemptId, "generating", "rendering");
    const renderResult = await ReportPdfService.generate(attemptId);
    
    await ReportRepository.updateReportStatus(attemptId, "generating", "uploading");
    const fileRef = await uploadReport(renderResult.buffer, userId, attemptId);
    
    return { 
      fileRef,
      generationTimeMs: renderResult.generationTimeMs,
      fileSizeKb: renderResult.fileSizeKb,
      pageCount: renderResult.pageCount
    };
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
});

export const POST = withLogging(workflowHandler, { component: "workflow", operation: "pdf_report" });
