import { db, exams } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';

export const dynamic = 'force-dynamic';
const log = logger.child({ module: 'reports:list' });

/**
 * GET USER REPORTS
 * GET /api/reports
 */
async function handler(req: NextRequest) {
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
        return NextResponse.json({ error: 'Missing report id for internal bypass' }, { status: 400 });
      }

      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, id),
        columns: { userId: true, status: true }
      });

      if (!exam) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      // Bypass ownership check for internal service
      userId = exam.userId;

      // Internal check: also handle status gating here to avoid double query
      if (exam.status === 'started') {
        return NextResponse.json({ error: 'Exam still in progress' }, { status: 409 });
      }
      if (exam.status === 'processing') {
        return NextResponse.json({ status: 'processing', message: 'Report is generating...' }, { status: 202 });
      }
    } else {
      const token = TokenService.getAccessToken(req, { scope: 'user' });
      if (token == null || token === '') {
        return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });
      }
      
      const payload = await TokenService.verifyAccessToken(token, false);
      userId = payload.userId;

      // User check: strict ownership and status gating
      if (id !== '') {
        const examCheck = await db.query.exams.findFirst({
          where: eq(exams.id, id),
          columns: { userId: true, status: true }
        });

        if (!examCheck) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        if (examCheck.userId !== userId) {
          return NextResponse.json({ error: 'Forbidden: ownership mismatch' }, { status: 403 });
        }

        if (examCheck.status === 'started') {
          return NextResponse.json({ error: 'Exam still in progress' }, { status: 409 });
        }
        if (examCheck.status === 'processing') {
          return NextResponse.json({ status: 'processing', message: 'Report is generating...' }, { status: 202 });
        }
      }
    }

    // 3. Data Retrieval
    if (id !== '') {
      if (type === 'premium') {
        const report = await ReportEngine.getPremiumExamReport(id);
        const durationMs = Date.now() - start;
        recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'success', type: 'premium' });
        recordTimer(METRICS.REPORTS.VIEW + '.duration', durationMs, { outcome: 'success', type: 'premium' });
        return NextResponse.json(report, {
          headers: { 'X-Duration-Ms': durationMs.toString() }
        });
      }

      const report = await ReportEngine.getExamReport(id, { includeCorrectAnswers: false });
      const durationMs = Date.now() - start;
      recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'success', type: 'standard' });
      recordTimer(METRICS.REPORTS.VIEW + '.duration', durationMs, { outcome: 'success', type: 'standard' });
      return NextResponse.json(report, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
      });
    }

    // Default: General user performance
    const report = await ReportEngine.getUserPerformance(userId);
    const durationMs = Date.now() - start;
    recordCounter(METRICS.REPORTS.LIST, 1, { outcome: 'success' });
    recordTimer(METRICS.REPORTS.LIST + '.duration', durationMs, { outcome: 'success' });
    return NextResponse.json(report, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const message = error.message;

    // Standard Next.js / Auth error filtering
    if (message.includes('Unauthorized') || message.includes('token') || message.includes('claim')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    
    if (message.includes('FORBIDDEN') || message.includes('belong')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes('Analytics not precomputed') || message.includes('Score is null')) {
      return NextResponse.json({ 
        status: 'processing', 
        message: 'Finalizing analytics matrix...' 
      }, { status: 202 });
    }

    log.error({ err: error, url: req.url }, "[ReportsAPI] 500 Error");
    const durationMs = Date.now() - start;
    recordCounter(METRICS.REPORTS.VIEW, 1, { outcome: 'failure' });
    recordTimer(METRICS.REPORTS.VIEW + '.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ 
      error: 'Infrastucture error during report generation', 
      debug: process.env.NODE_ENV === 'development' ? message : undefined 
    }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'reports', operation: 'get_reports' });
