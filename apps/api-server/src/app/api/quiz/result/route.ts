import { db, exams } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';

import { badRequest, forbidden, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest) {
  const startTime = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (token === null || token === undefined || token === '') {
      throw unauthorized("Unauthorized");
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required");
    }
    const searchParams = req.nextUrl.searchParams;
    const examId = searchParams.get('examId');

    if (typeof examId !== 'string' || examId.trim() === '') {
      throw badRequest('Missing examId');
    }

    const examCheck = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        columns: { userId: true, status: true }
    });

    if (examCheck === null || examCheck === undefined) {
        throw notFound('Exam session not found');
    }

    if (examCheck.userId !== payload.userId) {
      throw forbidden('You do not own this exam session');
    }

    if (examCheck.status === 'started') {
        return ApiResponse.error(new Error('Exam is still in progress'), 409);
    }
    if (examCheck.status === 'processing') {
        return ApiResponse.success({ 
            status: 'processing',
            message: 'Results are being calculated...' 
        }, 202, { 'Retry-After': '5' });
    }

    const result = await ReportEngine.getExamReport(examId, { includeCorrectAnswers: false });
    
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.QUIZ.SCORE, 1, { outcome: 'success' });
    recordTimer(METRICS.QUIZ.SCORE + '.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.QUIZ.SCORE, 1, { outcome: 'failure' });
    recordTimer(METRICS.QUIZ.SCORE + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error, 400, durationMs.toString());
  }
}

export const GET = withLogging(getHandler, { component: 'quiz', operation: 'get_exam_result' });
