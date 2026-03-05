import { db, exams } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';

import { badRequest, forbidden, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { ReportEngine } from '@/modules/report-engine/report.engine';

export const dynamic = 'force-dynamic';
const log = logger.child({ module: 'reports:list' });

/**
 * GET USER REPORTS
 * GET /api/reports
 */
async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    
    // 1. Unified Parameter Handling
    const rawId = searchParams.get('id') ?? searchParams.get('attemptId') ?? searchParams.get('examId') ?? '';
    const id = rawId.trim();
    const type = searchParams.get('type');

    // 2. Auth Context (Internal vs User)
    const internalKeyHeader = req.headers.get('x-internal-key') ?? '';
    const internalSecret = process.env.INTERNAL_API_KEY ?? 'secret';
    const isInternal = internalKeyHeader !== '' && internalSecret !== '' && internalKeyHeader === internalSecret;

    let userId: string;

    if (isInternal) {
      if (id === '') {
        throw badRequest('Missing report id for internal bypass');
      }

      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, id),
        columns: { userId: true, status: true }
      });

      if (!exam) {
        throw notFound('Report', id);
      }

      userId = exam.userId;

      if (exam.status === 'started') {
        return ApiResponse.error(new Error('Exam still in progress'), 409);
      }
      if (exam.status === 'processing') {
        return ApiResponse.success({ status: 'processing', message: 'Report is generating...' }, 202);
      }
    } else {
      const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
      if (token === undefined || token === null || token === '') {
        throw unauthorized('Unauthorized');
      }
      
      const payload = await container.get(TokenService).verifyAccessToken(token, false);
      userId = payload.userId;

      if (id !== '') {
        const examCheck = await db.query.exams.findFirst({
          where: eq(exams.id, id),
          columns: { userId: true, status: true }
        });

        if (!examCheck) {
          throw notFound('Report', id);
        }

        if (examCheck.userId !== userId) {
          throw forbidden('Forbidden: ownership mismatch');
        }

        if (examCheck.status === 'started') {
          return ApiResponse.error(new Error('Exam still in progress'), 409);
        }
        if (examCheck.status === 'processing') {
          return ApiResponse.success({ status: 'processing', message: 'Report is generating...' }, 202);
        }
      }
    }

    // 3. Data Retrieval
    if (id !== '') {
      const report = type === 'premium'
        ? await ReportEngine.getPremiumExamReport(id)
        : await ReportEngine.getExamReport(id, { includeCorrectAnswers: false });
      
      const durationMs = Date.now() - start;
      const reportType = type === 'premium' ? 'premium' : 'standard';
      
      recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'success', type: reportType });
      recordTimer(METRICS.REPORTS.VIEW + '.duration', durationMs, { outcome: 'success', type: reportType });
      
      return ApiResponse.success(report, 200, {
        'X-Duration-Ms': durationMs.toString()
      });
    }

    const report = await ReportEngine.getUserPerformance(userId);
    const durationMs = Date.now() - start;
    recordCounter(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.fetch', 1, { outcome: 'success' }); // Preserving existing inconsistent metric if needed? No, use REPORT ones.
    recordCounter(METRICS.REPORTS.LIST, 1, { outcome: 'success' });
    recordTimer(METRICS.REPORTS.LIST + '.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(report, 200, {
      'X-Duration-Ms': durationMs.toString()
    });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const message = error.message;

    if (message.includes('Analytics not precomputed') || message.includes('Score is null')) {
      return ApiResponse.success({ 
        status: 'processing', 
        message: 'Finalizing analytics matrix...' 
      }, 202);
    }

    log.error({ err: error, url: req.url }, "[ReportsAPI] Error");
    recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'reports', operation: 'get_reports' });
