import { NextResponse } from "next/server";

import { acquireJobLock, releaseJobLock } from "@/lib/job-lock";
import { logger } from "@/lib/logger";
import { verifyQStashSignature } from "@/lib/qstash-verify";
import { withLogging } from "@/lib/withLogging";
import { AdminQuestionEngine } from "@/modules/admin-engine/admin.engine";

export const dynamic = "force-dynamic";

/**
 * Durable Workflow for bulk importing questions.
 * Processes questions in small batches to avoid function timeouts.
 * Replaces the brittle synchronous loop in the API route.
 */
let workflowHandlerPromise: Promise<(req: Request) => Promise<Response>> | null = null;

async function getWorkflowHandler() {
    if (workflowHandlerPromise !== null) {
        return workflowHandlerPromise;
    }

    workflowHandlerPromise = (async () => {
        const { serve } = await import("@upstash/workflow/nextjs");
        const { POST } = serve<{
            questions: Record<string, unknown>[];
            context: {
                topicId: string;
                subtopicId?: string;
                skillId?: string;
                skillIds?: string[];
            };
            adminId: string;
            jobId: string;
        }>(
            async (context) => {
                const { questions, context: contextMeta, adminId } = context.requestPayload;

                logger.info({ count: questions.length, adminId }, "[Workflow] Starting Bulk Import Workflow");

                const batchSize = 10;
                const totalBatches = Math.ceil(questions.length / batchSize);

                for (let i = 0; i < questions.length; i += batchSize) {
                    const batch = questions.slice(i, i + batchSize);
                    const batchNum = Math.floor(i / batchSize) + 1;

                    await context.run(`process-batch-${batchNum}`, async () => {
                        logger.info({ batch: batchNum, total: totalBatches, size: batch.length }, "[Workflow] Processing batch");

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await AdminQuestionEngine.bulkCreateQuestionsWithContext(batch as any, contextMeta, adminId);
                    });
                }

                logger.info({ count: questions.length }, "[Workflow] Bulk Import Workflow completed successfully");
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

export const POST = withLogging(securedHandler, { component: 'workflow', operation: 'bulk_import' });
