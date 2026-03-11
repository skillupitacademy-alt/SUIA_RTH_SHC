import { bootstrapContainer } from './lib/app.container';

export const runtime = 'nodejs';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  
  // 1. Composition Root: Initialize DI Container
  bootstrapContainer();
  console.log('[Bootstrap] DI Container initialized');

  // 2. Queue Infrastructure (Task 106/111)
  const redisUrl = process.env.REDIS_URL;
  const queueEnabled = process.env.QUEUE_ENABLED === 'true';

  if (queueEnabled && (redisUrl !== undefined && redisUrl !== '')) {
    const { registerQueues } = await import('./lib/queue/queues');
    await Promise.all([
      import('./lib/queue/workers/email.worker'),
      import('./lib/queue/workers/scoring.worker'),
      import('./lib/queue/workers/analytics.worker'),
      import('./modules/exam-engine/saga.worker')
    ]);

    await registerQueues();
    console.log('[Bootstrap] BullMQ Queues and Workers registered');
  } else {
    console.log('[Bootstrap] BullMQ Infrastructure skipped (disabled or no REDIS_URL)');
  }
}
