import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';

export const dynamic = 'force-dynamic';

/**
 * GET USER REPORTS
 * GET /api/reports
 */
export async function GET(req: NextRequest) {
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
        return NextResponse.json(report);
      }

      const report = await ReportEngine.getExamReport(id, { includeCorrectAnswers: false });
      return NextResponse.json(report);
    }

    // Default: General user performance
    const report = await ReportEngine.getUserPerformance(userId);
    return NextResponse.json(report);

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

    console.error(`[ReportsAPI] 500 Error:`, { message, url: req.url });
    
    return NextResponse.json({ 
      error: 'Infrastucture error during report generation', 
      debug: process.env.NODE_ENV === 'development' ? message : undefined 
    }, { status: 500 });
  }
}
