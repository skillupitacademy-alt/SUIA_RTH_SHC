import { db, exams } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const startTime = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const searchParams = _req.nextUrl.searchParams;
    const examId = searchParams.get('examId');

    if (typeof examId !== 'string' || examId.trim() === '') {
      return NextResponse.json({ _error: 'Missing examId' }, { status: 400 });
    }

    const examCheck = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        columns: {
            userId: true,
            status: true,
        }
    });

    if (!examCheck) {
        return NextResponse.json({ _error: 'Exam session not found' }, { status: 404 });
    }

    if (examCheck.userId !== _payload.userId) {
      return NextResponse.json({ _error: 'Forbidden: You do not own this exam session' }, { status: 403 });
    }

    if (examCheck.status === 'started') {
        return NextResponse.json({ _error: 'Exam is still in progress' }, { status: 409 });
    }
    if (examCheck.status === 'processing') {
        return NextResponse.json({ 
            status: 'processing',
            message: 'Results are being calculated...' 
        }, { status: 202, headers: { 'Retry-After': '5' } });
    }

    const result = await ReportEngine.getExamReport(examId, { includeCorrectAnswers: false });
    
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.QUIZ.SCORE, 1, { outcome: 'success' });
    recordTimer(METRICS.QUIZ.SCORE + '.duration', durationMs, { outcome: 'success' });
    
    return NextResponse.json(result, {
        headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    recordCounter(METRICS.QUIZ.SCORE, 1, { outcome: 'failure', error: message });
    recordTimer(METRICS.QUIZ.SCORE + '.duration', Date.now() - startTime, { outcome: 'failure' });
    if (message.includes('_token') || message.includes('signature')) {
        return NextResponse.json({ _error: 'Invalid _token' }, { status: 401 });
    }
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}

export const GET = withLogging(handler, { component: 'quiz', operation: 'get_exam_result' });
