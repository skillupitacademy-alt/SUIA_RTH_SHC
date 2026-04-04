import { db, exams } from "@quiz/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { acquireJobLock, releaseJobLock } from "@/lib/job-lock";
import { logger } from "@/lib/logger";
import { verifyQStashSignature } from "@/lib/qstash-verify";
import { uploadReport } from "@/lib/storage/upload-report";
import { withLogging } from "@/lib/withLogging";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const dynamic = "force-dynamic";

let workflowHandlerPromise: Promise<(req: Request) => Promise<Response>> | null = null;

async function getWorkflowHandler() {
  if (workflowHandlerPromise !== null) {
    return workflowHandlerPromise;
  }

  workflowHandlerPromise = (async () => {
    const { serve } = await import("@upstash/workflow/nextjs");
    const { POST } = serve<{ attemptId: string; userId: string }>(async (context) => {
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
        const fileRef = await uploadReport(renderResult.buffer, userId, attemptId, {
          fileBasename: `${attemptId}-student-infograph-report`,
        });

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

    return POST;
  })();

  return workflowHandlerPromise;
}

const securedHandler = async (req: Request) => {
  const { valid, body } = await verifyQStashSignature(req);
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { attemptId?: string };
  try {
    payload = JSON.parse(body) as { attemptId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const attemptId = typeof payload.attemptId === 'string' ? payload.attemptId.trim() : '';
  if (attemptId === '') {
    return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });
  }

  const lockId = `pdf-report:${attemptId}`;
  const locked = await acquireJobLock(lockId);
  if (!locked) {
    return NextResponse.json({ message: 'Duplicate job ignored' }, { status: 200 });
  }

  try {
    const nextReq = new Request(req.url, { method: 'POST', headers: req.headers, body });
    const workflowHandler = await getWorkflowHandler();
    return await workflowHandler(nextReq);
  } finally {
    await releaseJobLock(lockId);
  }
};

export const POST = withLogging(securedHandler, { component: "workflow", operation: "pdf_report" });
