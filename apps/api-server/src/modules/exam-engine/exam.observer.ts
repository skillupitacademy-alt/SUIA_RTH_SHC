import { logger } from '@/lib/logger';
import { container } from '@/modules/core/container';
import { eventBus } from '@/modules/core/event-bus';

import { PerformanceService } from '../report-engine/performance.service';
import { ReportEngine } from '../report-engine/report.engine';

export class ExamObserver {
  private static log = logger.child({ module: 'exam-engine:observer' });

  static init() {
    const performanceService = container.get(PerformanceService);
    const reportEngine = container.get(ReportEngine);

    eventBus.on('EXAM_COMPLETED', ({ examId }) => {
      void (async () => {
        this.log.info({ examId }, 'Observer: Handling EXAM_COMPLETED');

        try {
          // 1. Refresh Materialized Views
          await performanceService.refreshAnalytics();

          // 2. Materialize Report
          const { ReportMaterializer } = await import('../../services/reports/ReportMaterializer');
          await ReportMaterializer.materialize(examId);

          // 3. Prime Cache
          const reportData = await reportEngine.getPremiumExamReport(examId);
          await performanceService.cacheReport(examId, reportData);

          // 4. Trigger PDF Generation (Background)
          this.triggerPdfGeneration(examId);

          this.log.info({ examId }, 'Observer: Completed side effects for exam');
        } catch (err) {
          this.log.error({ examId, err }, 'Observer: Failed to handle EXAM_COMPLETED');
        }
      })();
    });

    this.log.info('ExamObserver initialized');
  }

  private static triggerPdfGeneration(examId: string) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== '')
      ? process.env.NEXT_PUBLIC_API_URL
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
