import { eventBus } from '@/lib/event-bus';
import { AppEvents } from '@/lib/events';
import { logger } from '@/lib/logger';

export class ExamObserver {
  private static log = logger.child({ module: 'exam-engine:observer' });

  static init() {
    eventBus.onEvent(AppEvents.EXAM_COMPLETED, ({ examId }) => {
      this.log.info({ examId }, 'Observer: Handling post-exam side effects');
      
      // Optional report generation must not delay or reject exam completion.
      void this.triggerPdfGeneration(examId);
    });

    this.log.info('ExamObserver initialized');
  }

  private static async triggerPdfGeneration(examId: string): Promise<void> {
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey === undefined || internalKey.trim() === '') {
      this.log.warn({ examId, reason: 'missing_internal_key' }, 'Observer: Report trigger unavailable');
      return;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (apiBase === undefined || apiBase === '') {
      this.log.warn({ examId, reason: 'missing_api_url' }, 'Observer: Report trigger unavailable');
      return;
    }

    let endpoint: URL;
    try {
      endpoint = new URL(apiBase);
      if (!['http:', 'https:'].includes(endpoint.protocol) ||
          endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
        throw new Error('Invalid report API configuration');
      }
      const basePath = endpoint.pathname.replace(/\/+$/, '');
      endpoint.pathname = `${basePath || '/api'}/generate-report`;
    } catch {
      this.log.warn({ examId, reason: 'invalid_api_url' }, 'Observer: Report trigger unavailable');
      return;
    }

    try {
      const response = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': internalKey },
        body: JSON.stringify({ attemptId: examId }),
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        this.log.error({ examId, reason: 'http_error', status: response.status }, 'Observer: Report trigger failed');
      }
    } catch {
      this.log.error({ examId, reason: 'request_failed' }, 'Observer: Report trigger failed');
    }
  }
}
