import { eventBus } from '@/lib/event-bus';
import { AppEvents } from '@/lib/events';
import { logger } from '@/lib/logger';

import type { AnalyticsJobPayload } from '../../lib/queue/job-types';
import { QueueFactory } from '../../lib/queue-factory';

export class ExamObserver {
  private static log = logger.child({ module: 'exam-engine:observer' });
  private static analyticsQueue: ReturnType<typeof QueueFactory.getQueue<AnalyticsJobPayload>> | null = null;

  private static getAnalyticsQueue() {
    if (this.analyticsQueue === null) {
      this.analyticsQueue = QueueFactory.getQueue<AnalyticsJobPayload>('analyticsQueue');
    }
    return this.analyticsQueue;
  }

  static init() {
    eventBus.onEvent(AppEvents.EXAM_COMPLETED, ({ examId }) => {
      this.log.info({ examId }, 'Observer: Offloading side effects to background worker');
      
      void (async () => {
        try {
          // Task 108: Offload heavy processing to BullMQ
          const queue = this.getAnalyticsQueue();
          await queue.add('post_exam_' + examId, {
            examId,
            processingType: 'post_exam_processing',
          } satisfies AnalyticsJobPayload);

          // Keep PDF trigger for now as it's quick (async fetch)
          this.triggerPdfGeneration(examId);
        } catch (err) {
          this.log.error({ examId, err }, 'Observer: Failed to queue background tasks');
        }
      })();
    });

    this.log.info('ExamObserver initialized with background capabilities');
  }

  private static triggerPdfGeneration(examId: string) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== '')
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
      : 'http://localhost:3002/api';

    fetch(`${apiBase}/generate-report`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY !== undefined && process.env.INTERNAL_API_KEY !== ''
          ? process.env.INTERNAL_API_KEY
          : 'secret'
      },
      body: JSON.stringify({ attemptId: examId })
    }).catch(err => this.log.error({ examId, err }, 'Observer: Failed to trigger PDF generation'));
  }
}
