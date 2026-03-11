import { serve } from "@upstash/workflow/nextjs";

import { logger } from "@/lib/logger";
import { withLogging } from "@/lib/withLogging";
import { AdminQuestionEngine } from "@/modules/admin-engine/admin.engine";

export const dynamic = "force-dynamic";

/**
 * Durable Workflow for bulk importing questions.
 * Processes questions in small batches to avoid function timeouts.
 * Replaces the brittle synchronous loop in the API route.
 */
const { POST: workflowHandler } = serve<{ 
    questions: any[]; 
    context: any; 
    adminId: string;
}>(
  async (context) => {
    const { questions, context: contextMeta, adminId } = context.requestPayload;
    
    logger.info({ count: questions.length, adminId }, "[Workflow] Starting Bulk Import Workflow");

    // Process in batches of 10 to ensure we stay well within Vercel's 10s execution limit per step
    const batchSize = 10;
    const totalBatches = Math.ceil(questions.length / batchSize);

    for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        
        await context.run(`process-batch-${batchNum}`, async () => {
             logger.info({ batch: batchNum, total: totalBatches, size: batch.length }, "[Workflow] Processing batch");
             
             // AdminQuestionEngine is a container-managed singleton exported from admin.engine
             await AdminQuestionEngine.bulkCreateQuestionsWithContext(batch, contextMeta, adminId);
        });
    }

    logger.info({ count: questions.length }, "[Workflow] Bulk Import Workflow completed successfully");
  }
);

export const POST = withLogging(workflowHandler, { component: 'workflow', operation: 'bulk_import' });
