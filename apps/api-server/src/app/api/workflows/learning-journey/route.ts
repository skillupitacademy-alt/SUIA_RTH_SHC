import { NextResponse } from "next/server";

import { acquireJobLock, releaseJobLock } from "@/lib/job-lock";
import { logger } from "@/lib/logger";
import { verifyQStashSignature } from "@/lib/qstash-verify";
import { withLogging } from "@/lib/withLogging";

export const dynamic = "force-dynamic";

/**
 * Durable Workflow for managing a student's learning journey.
 * Orchestrates engagement steps over several days.
 */
let workflowHandlerPromise: Promise<(req: Request) => Promise<Response>> | null = null;

async function getWorkflowHandler() {
  if (workflowHandlerPromise !== null) {
    return workflowHandlerPromise;
  }

  workflowHandlerPromise = (async () => {
    const { serve } = await import("@upstash/workflow/nextjs");
    const { POST } = serve<{ userId: string; examId: string; score: number }>(
      async (context) => {
        const { userId, examId, score } = context.requestPayload;

        logger.info({ userId, examId, score }, "[Workflow] Starting Learning Journey");

        await context.run("initial-analysis", async () => {
          logger.info({ userId }, "[Workflow] Performing initial analysis of exam performance");
        });

        const waitTime = score < 60 ? "48h" : "96h";

        logger.info({ userId, waitTime }, "[Workflow] Scheduling retention followup");
        await context.sleep("wait-for-retention", waitTime);

        await context.run("send-followup", async () => {
          logger.info({ userId }, "[Workflow] Sending personalized retention followup based on performance");
        });

        await context.run("finalize-journey", async () => {
          logger.info({ userId }, "[Workflow] Journey completed successfully");
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

  let payload: { userId?: string; examId?: string };
  try {
    payload = JSON.parse(body) as { userId?: string; examId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const userId = typeof payload.userId === 'string' ? payload.userId.trim() : '';
  const examId = typeof payload.examId === 'string' ? payload.examId.trim() : '';
  if (userId === '' || examId === '') {
    return NextResponse.json({ error: 'Missing userId or examId' }, { status: 400 });
  }

  const lockId = `learning-journey:${userId}:${examId}`;
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

export const POST = withLogging(securedHandler, { component: 'workflow', operation: 'learning_journey' });
