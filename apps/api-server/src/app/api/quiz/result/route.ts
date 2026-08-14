import { db, exams } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';

import { badRequest, forbidden, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { ReportEngine } from '@/modules/report-engine/report.engine';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest) {
  const startTime = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    if (token === null || token === undefined || token === '') {
      throw unauthorized("Unauthorized");
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
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
        columns: { userId: true, status: true, totalScore: true }
    });

    if (examCheck === null || examCheck === undefined) {
        throw notFound('Exam session not found');
    }

    if (examCheck.userId !== payload.userId) {
      throw forbidden('You do not own this exam session');
    }

    if (examCheck.status === 'started') {
        return ApiResponse.success({ 
            status: 'started',
            message: 'Exam is still finishing...' 
        }, 202, { 'Retry-After': '5' });
    }
    let resolvedStatus = examCheck.status;
    if (resolvedStatus === 'processing' && process.env.QUEUE_ENABLED !== 'true') {
        await ScoringEngine.calculateExamResults(examId);
        resolvedStatus = 'completed';
    }
    
    // 🔴 FIX: Better safety net - check if there are answered questions with isCorrect=null
    // instead of checking totalScore === 0 (which is a valid score!)
    if (resolvedStatus === 'completed') {
        const { examQuestions } = await db.query.exams.findFirst({
            where: eq(exams.id, examId),
            with: {
                examQuestions: {
                    columns: { userAnswer: true, isCorrect: true }
                }
            }
        }) ?? { examQuestions: [] };
        
        const hasAnsweredQuestionsWithNullCorrectness = examQuestions.some(
            eq => (eq.userAnswer !== null && eq.userAnswer !== '' && eq.isCorrect === null)
        );
        
        if (hasAnsweredQuestionsWithNullCorrectness) {
            // Re-score because there are answered questions that weren't evaluated
            await ScoringEngine.calculateExamResults(examId);
        }
    }

    if (resolvedStatus === 'processing') {
        return ApiResponse.success({ 
            status: 'processing',
            message: 'Results are being calculated...' 
        }, 202, { 'Retry-After': '5' });
    }

    const result = await ReportEngine.getExamReport(examId, { includeCorrectAnswers: false });
    
    // Don't transform with toExamResultDTO - it strips out critical data!
    // Frontend expects the full report format with score, total, questions, performance, etc.

    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.QUIZ.SCORE, 1, { outcome: 'success' });
    recordTimer(METRICS.QUIZ.SCORE + '.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success(result, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Analytics not precomputed') || message.includes('Score is null')) {
      return ApiResponse.success({ 
        status: 'processing', 
        message: 'Finalizing analytics matrix...' 
      }, 202);
    }

    recordCounter(METRICS.QUIZ.SCORE, 1, { outcome: 'failure' });
    recordTimer(METRICS.QUIZ.SCORE + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error, 400, durationMs.toString());
  }
}

export const GET = withLogging(getHandler, { component: 'quiz', operation: 'get_exam_result' });
