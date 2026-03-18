import { logger } from '@/lib/logger';

export interface EnqueueOptions {
  delay?: number; // Delay in seconds
  retries?: number;
}

export class QueueService {
  private static instance: QueueService;
  private qstashUrl: string;
  private qstashToken: string | null;
  private appUrl: string;

  private constructor() {
    const baseUrl = process.env.QSTASH_URL;
    this.qstashUrl = (typeof baseUrl === 'string' && baseUrl.trim() !== '') ? baseUrl : 'https://qstash.upstash.io/v2/publish/';

    const token = process.env.QSTASH_TOKEN;
    this.qstashToken = (typeof token === 'string' && token.trim() !== '') ? token : null;

    const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
    const internalUrl = process.env.INTERNAL_API_URL;

    if (typeof publicUrl === 'string' && publicUrl.trim() !== '') {
      this.appUrl = publicUrl;
    } else if (typeof internalUrl === 'string' && internalUrl.trim() !== '') {
      this.appUrl = internalUrl;
    } else {
      this.appUrl = 'http://localhost:3000';
    }
  }

  public static getInstance(): QueueService {
    if (QueueService.instance === undefined) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  /**
   * Enqueues a job to be processed asynchronously via a worker endpoint.
   */
  public async enqueue(jobType: string, payload: Record<string, unknown>, options?: EnqueueOptions): Promise<{ success: boolean; messageId?: string }> {
    if (this.qstashToken === null) {
      logger.warn({ jobType }, '[Queue] QSTASH_TOKEN not found, falling back to synchronous execution (pseudo-async)');
      return { success: false };
    }

    const workerUrl = `${this.appUrl}/api/workers/process-job`;
    
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.qstashToken}`,
        'Content-Type': 'application/json',
        'Upstash-Forward-Job-Type': jobType,
      };

      if (options?.delay !== undefined) {
        headers['Upstash-Delay'] = `${options.delay}s`;
      }

      if (options?.retries !== undefined) {
        headers['Upstash-Retries'] = `${options.retries}`;
      }

      const response = await fetch(`${this.qstashUrl}${workerUrl}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ error, status: response.status }, '[Queue] Failed to enqueue job');
        return { success: false };
      }

      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } catch (e) {
      logger.error({ err: e }, '[Queue] Error during enqueue');
      return { success: false };
    }
  }
}

export const queueService = QueueService.getInstance();
