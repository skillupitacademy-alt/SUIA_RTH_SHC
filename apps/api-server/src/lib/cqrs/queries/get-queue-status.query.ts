import { backgroundJobs,dbReadOnly } from '@quiz/db';
import { desc, eq } from 'drizzle-orm';

import { QueueFactory } from '@/lib/queue-factory';

import { Query, QueryHandler } from '../query-bus';

export class GetQueueStatusQuery implements Query {
  readonly type = 'GetQueueStatusQuery';
  constructor() {}
}

export class GetQueueStatusHandler implements QueryHandler<GetQueueStatusQuery> {
  async handle(_query: GetQueueStatusQuery): Promise<unknown> {
    const scoringQueue = QueueFactory.getQueue('scoring-queue');
    const emailQueue = QueueFactory.getQueue('email-queue');
    const analyticsQueue = QueueFactory.getQueue('analytics-queue');

    const [scoringJobCounts, emailJobCounts, analyticsJobCounts] = await Promise.all([
      scoringQueue.getJobCounts(),
      emailQueue.getJobCounts(),
      analyticsQueue.getJobCounts(),
    ]);

    // Also fetch last 10 failed jobs from DB for observability - using dbReadOnly
    const failedJobs = await dbReadOnly.query.backgroundJobs.findMany({
      where: eq(backgroundJobs.status, 'failed'),
      orderBy: [desc(backgroundJobs.updatedAt)],
      limit: 10,
    });

    return {
      queues: {
        scoring: scoringJobCounts,
        email: emailJobCounts,
        analytics: analyticsJobCounts,
      },
      recentFailures: failedJobs.map(j => ({
        id: j.id,
        type: j.type,
        error: j.error,
        updatedAt: j.updatedAt,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}
