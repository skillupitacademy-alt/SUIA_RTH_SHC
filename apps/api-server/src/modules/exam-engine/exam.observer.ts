import { eventBus } from '@/lib/event-bus';
import { AppEvents } from '@/lib/events';
import { logger } from '@/lib/logger';

export class ExamObserver {
  private static log = logger.child({ module: 'exam-engine:observer' });

  static init() {
    eventBus.onEvent(AppEvents.EXAM_COMPLETED, ({ examId }) => {
      this.log.info({ examId }, 'Observer: Handling post-exam side effects');
      
      //pdf trigger as it's quick (async fetch)
      this.triggerPdfGeneration(examId);
    });

    this.log.info('ExamObserver initialized');
  }

  private static triggerPdfGeneration(examId: string) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== '')
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
      : 'https://api.skillhubcore.in/api';

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
