import { Client } from "@upstash/workflow";

import { logger } from "@/lib/logger";

/**
 * Service to orchestrate student engagement via durable workflows.
 */
export class EngagementWorkflowService {
  private static client: Client | null = null;

  private static getClient() {
    if (this.client) return this.client;
    
    // Note: Upstash Workflow uses the same token as QStash usually, 
    // but can be configured separately.
    const token = process.env.QSTASH_TOKEN;
    if (typeof token !== 'string' || token.trim() === '') {
      logger.warn("[EngagementService] QSTASH_TOKEN not found. Workflows disabled.");
      return null;
    }

    this.client = new Client({
      token,
    });
    
    return this.client;
  }

  /**
   * Start a new Learning Journey workflow for a student.
   */
  static async startLearningJourney(userId: string, examId: string, score: number) {
    const client = this.getClient();
    if (!client) return;

    try {
      // The URL points to our app's workflow endpoint
      const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
      const internalUrl = process.env.INTERNAL_API_URL;
      const appUrl = typeof publicUrl === 'string' && publicUrl.trim() !== ''
        ? publicUrl
        : typeof internalUrl === 'string' && internalUrl.trim() !== ''
          ? internalUrl
          : 'https://api.skillhubcore.in';
      const workflowUrl = `${appUrl}/api/workflows/learning-journey`;

      const { workflowRunId } = await client.trigger({
        url: workflowUrl,
        body: { userId, examId, score },
      });

      logger.info({ workflowRunId, userId }, "[EngagementService] Workflow triggered successfully");
      return workflowRunId;
    } catch (error) {
      logger.error({ err: error, userId }, "[EngagementService] Failed to trigger workflow");
      return null;
    }
  }
}
