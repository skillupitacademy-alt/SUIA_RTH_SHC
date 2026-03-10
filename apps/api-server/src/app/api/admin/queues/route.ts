import type { Queue } from 'bullmq';
import type { NextRequest } from 'next/server';

import { badRequest, internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { logger } from '@/lib/logger';
import { QUEUE_ENABLED } from '@/lib/queue/queue.config';
import {
  analyticsQueue,
  cleanupQueue,
  deadLetterQueue,
  emailQueue,
  notificationQueue,
  sagaQueue,
  scoringQueue,
} from '@/lib/queue/queues';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { jobActionSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

const queuesMap: Record<string, Queue | undefined> = {
  scoring: scoringQueue,
  email: emailQueue,
  analytics: analyticsQueue,
  cleanup: cleanupQueue,
  notification: notificationQueue,
  saga: sagaQueue,
  dead: deadLetterQueue
};

async function getHandler(_req: NextRequest) {
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token == null || _token.length === 0) {
      return ApiResponse.error(unauthorized('Unauthorized'), 401);
    }
    await container.get(TokenService).verifyAdminAccessToken(_token);

    if (QUEUE_ENABLED !== true) {
      return ApiResponse.success({
        enabled: false,
        message: 'Queues are disabled via QUEUE_ENABLED configuration.',
        queues: []
      });
    }

    const queuesToMonitor = [
      { id: 'scoring', name: 'Scoring', queue: scoringQueue },
      { id: 'email', name: 'Email', queue: emailQueue },
      { id: 'analytics', name: 'Analytics', queue: analyticsQueue },
      { id: 'saga', name: 'Exam Lifecycle', queue: sagaQueue },
      { id: 'dead', name: 'Dead Letter', queue: deadLetterQueue },
      { id: 'cleanup', name: 'Cleanup', queue: cleanupQueue },
      { id: 'notification', name: 'Notification', queue: notificationQueue }
    ];

    const statsPromises = queuesToMonitor.map(async (q) => {
      try {
        const counts = await q.queue.getJobCounts(
          'wait', 'active', 'completed', 'failed', 'delayed', 'paused'
        );
        
        // Fetch last 5 failed jobs
        const failedJobs = await q.queue.getFailed(0, 4);
        const lastFailed = failedJobs.map(job => ({
          id: job.id,
          name: job.name,
          failedReason: job.failedReason,
          finishedOn: job.finishedOn != null ? new Date(job.finishedOn).toISOString() : null,
          data: job.data
        }));

        return {
          id: q.id,
          queueName: q.queue.name,
          displayName: q.name,
          status: 'online',
          counts,
          lastFailed
        };
      } catch (err) {
        logger.error({ queue: q.queue.name, err }, 'Failed to fetch queue job counts');
        return {
          id: q.id,
          queueName: q.queue.name,
          displayName: q.name,
          status: 'error',
          counts: null,
          lastFailed: []
        };
      }
    });

    const queueStats = await Promise.all(statsPromises);

    return ApiResponse.success({
      enabled: true,
      timestamp: new Date().toISOString(),
      queues: queueStats
    });

  } catch (_error: unknown) {
    logger.error({ error: _error }, 'Failed to fetch admin queue stats');
    const _message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return ApiResponse.error(internalError(_message), 500);
  }
}

async function postHandler(_req: NextRequest) {
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token == null || _token.length === 0) {
      return ApiResponse.error(unauthorized('Unauthorized'), 401);
    }
    await container.get(TokenService).verifyAdminAccessToken(_token);

    const body = await _req.json();
    const result = jobActionSchema.safeParse(body);
    if (!result.success) {
      return ApiResponse.error(badRequest('Invalid action payload'), 400);
    }

    const { queueName, jobId, action } = result.data;
    const queue = queuesMap[queueName];

    if (!queue) {
      return ApiResponse.error(badRequest(`Unknown queue: ${queueName}`), 400);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return ApiResponse.error(badRequest(`Job ${jobId} not found in ${queueName}`), 404);
    }

    switch (action) {
      case 'retry':
        if (queueName === 'dead') {
          const payload = job.data as { originalQueue: string; data: unknown };
          // Find original queue instance
          const originalQueueName = payload.originalQueue;
          const targetQueue = Object.values(queuesMap).find(q => q?.name === originalQueueName);
          
          if (!targetQueue) {
            return ApiResponse.error(badRequest(`Original queue ${originalQueueName} not found`), 400);
          }

          await targetQueue.add(job.name.replace('dead_', ''), payload.data);
          await job.remove();
          
          logger.info({ jobId, originalQueue: originalQueueName, action }, 'Job retried from DLQ');
          return ApiResponse.success({ message: `Job moved back to ${originalQueueName}` });
        }
        
        await job.retry();
        logger.info({ jobId, queueName, action }, 'Job retried by admin');
        return ApiResponse.success({ message: 'Job retried' });
      
      case 'discard':
        await job.remove();
        logger.info({ jobId, queueName, action }, 'Job discarded by admin');
        return ApiResponse.success({ message: 'Job discarded' });

      case 'promote':
        await job.promote();
        logger.info({ jobId, queueName, action }, 'Job promoted by admin');
        return ApiResponse.success({ message: 'Job promoted to active' });

      default:
        return ApiResponse.error(badRequest(`Unsupported action: ${action}`), 400);
    }

  } catch (error) {
    logger.error({ error }, 'Failed to execute job action');
    const message = error instanceof Error ? error.message : 'Action failed';
    return ApiResponse.error(internalError(message), 500);
  }
}

export const GET = withCorrelationId(getHandler);
export const POST = withCorrelationId(postHandler);

