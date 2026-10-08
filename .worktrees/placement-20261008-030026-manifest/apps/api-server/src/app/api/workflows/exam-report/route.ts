import { JobStatus } from "@quiz/types";
import { NextResponse } from "next/server";

import { acquireJobLock, releaseJobLock } from "@/lib/job-lock";
import { logger } from "@/lib/logger";
import { verifyQStashSignature } from "@/lib/qstash-verify";
import { withLogging } from "@/lib/withLogging";
import { container } from "@/modules/core/container";
import { EmailService } from "@/modules/email/EmailService";
import { PerformanceService } from "@/modules/report-engine/performance.service";
import { ReportEngine } from "@/modules/report-engine/report.engine";
import { ScoringEngine } from "@/modules/scoring-engine/scoring.engine";
import { JobsService } from "@/modules/system/jobs.service";

export const dynamic = "force-dynamic";

/**
 * Durable Workflow for generating exam reports and analytics.
 * Replaces the unstable BullMQ worker in serverless environments.
 * Integrates with JobsService for frontend progress tracking.
 */
let workflowHandlerPromise: Promise<(req: Request) => Promise<Response>> | null = null;

async function getWorkflowHandler() {
  if (workflowHandlerPromise !== null) {
    return workflowHandlerPromise;
  }

  workflowHandlerPromise = (async () => {
    const { serve } = await import("@upstash/workflow/nextjs");
    const { POST } = serve<{ examId: string; userId: string; jobId?: string }>(
      async (context) => {
        const { examId, userId, jobId } = context.requestPayload;

        logger.info({ examId, userId, jobId }, "[Workflow] Starting Exam Report Workflow");

        await context.run("scoring", async () => {
          logger.info({ examId }, "[Workflow] Calculating scores");

          if (jobId !== undefined && jobId !== "") {
              await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING, { currentStep: 'scoring' });
          }

          await ScoringEngine.calculateExamResults(examId);

          const { TutorService } = await import('@/modules/tutor/tutor.service');
          void TutorService.processExamResults(examId);
        });

        await context.run("analytics", async () => {
            logger.info({ examId }, "[Workflow] Materializing report & caching");

            if (jobId !== undefined && jobId !== "") {
                await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING, { currentStep: 'analytics' });
            }

            const performanceService = container.get(PerformanceService);
            const reportEngine = container.get(ReportEngine);

            await performanceService.refreshAnalytics();

            const { ReportMaterializer } = await import('@/services/reports/ReportMaterializer');
            await ReportMaterializer.materialize(examId);

            const reportData = await reportEngine.getPremiumExamReport(examId);
            await performanceService.cacheReport(examId, reportData);
        });

        await context.run("notification", async () => {
            logger.info({ examId }, "[Workflow] Sending completion email");

            if (jobId !== undefined && jobId !== "") {
                await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING, { currentStep: 'notification' });
            }

            const emailService = EmailService.getInstance();

            await emailService.sendEmail({
                to: 'system@realtutorialhub.com',
                subject: `Exam ${examId} results are processed`,
                html: `<p>Your exam results for session ${examId} are now ready.</p>`,
                from: 'no-reply@realtutorialhub.com'
            });
        });

        await context.run("finalize", async () => {
            if (jobId !== undefined && jobId !== "") {
                await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
                    result: {
                        examId,
                        processedAt: new Date().toISOString()
                    }
                });
            }
            logger.info({ examId, jobId }, "[Workflow] Exam Report Workflow completed");
        });
      }
    );

    return POST;
  })();

  return workflowHandlerPromise;
}

const securedHandler = async (req: Request) => {
  const { valid, body } = await verifyQStashSignature(req);
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { jobId?: string };
  try {
    payload = JSON.parse(body) as { jobId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const jobId = typeof payload.jobId === 'string' ? payload.jobId.trim() : '';
  if (jobId === '') {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const locked = await acquireJobLock(jobId);
  if (!locked) {
    return NextResponse.json({ message: 'Duplicate job ignored' }, { status: 200 });
  }

  try {
    const nextReq = new Request(req.url, { method: 'POST', headers: req.headers, body });
    const workflowHandler = await getWorkflowHandler();
    return await workflowHandler(nextReq);
  } finally {
    await releaseJobLock(jobId);
  }
};

export const POST = withLogging(securedHandler, { component: 'workflow', operation: 'exam_report' });
