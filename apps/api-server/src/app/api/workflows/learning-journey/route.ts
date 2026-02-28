import { serve } from "@upstash/workflow/nextjs";

import { logger } from "@/lib/logger";
import { withLogging } from "@/lib/withLogging";

/**
 * Durable Workflow for managing a student's learning journey.
 * Orchestrates engagement steps over several days.
 */
const { POST: workflowHandler } = serve<{ userId: string; examId: string; score: number }>(
  async (context) => {
    const { userId, examId, score } = context.requestPayload;
    
    logger.info({ userId, examId, score }, "[Workflow] Starting Learning Journey");

    // Step 1: Immediate Post-Exam Analysis
    // We use context.run to make side-effects (like logging or simple DB hits) idempotent
    await context.run("initial-analysis", async () => {
      logger.info({ userId }, "[Workflow] Performing initial analysis of exam performance");
    });

    // Step 2: Adaptive Wait
    // If the student did well, we wait longer. If they failed, we followup sooner.
    const waitTime = score < 60 ? "48h" : "96h";
    
    logger.info({ userId, waitTime }, "[Workflow] Scheduling retention followup");
    await context.sleep("wait-for-retention", waitTime);

    // Step 3: Trigger Engagement
    // This could be an email, a push notification, or unlocking a specific "Recovery" lesson
    await context.run("send-followup", async () => {
      logger.info({ userId }, "[Workflow] Sending personalized retention followup based on performance");
      
      // In a real implementation:
      // await NotificationService.sendStudyPlan(userId, recommendation);
    });

    // Step 4: Finalize Journey
    await context.run("finalize-journey", async () => {
      logger.info({ userId }, "[Workflow] Journey completed successfully");
    });
  }
);

export const POST = withLogging(workflowHandler, { component: 'workflow', operation: 'learning_journey' });
