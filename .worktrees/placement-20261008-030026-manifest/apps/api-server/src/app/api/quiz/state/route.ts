import { METRICS } from '@quiz/observability';
import { type NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { SessionService } from '@/modules/exam-engine/session.service';

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

    // Guardrail: Validate UUID format to prevent SQL errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(examId)) {
        throw badRequest('Invalid examId format');
    }

    const state = await SessionService.resumePayload(examId, payload.userId);
    
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.QUIZ.STATE, 1, { outcome: 'success' });
    recordTimer(METRICS.QUIZ.STATE + '.duration', durationMs, { outcome: 'success' });

    return ApiResponse.success(state, 200, {
        'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.QUIZ.STATE, 1, { outcome: 'failure' });
    recordTimer(METRICS.QUIZ.STATE + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error, 400, durationMs.toString());
  }
}

export const GET = withLogging(getHandler, { component: 'quiz', operation: 'get_exam_state' });
