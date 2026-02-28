import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import type { CreateQuestionInput } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { questionSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'admin:questions' });

async function getHandler(_req: NextRequest) {
    const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, true);

    if (!(await _verifyAdmin(_payload))) {
        log.warn({ userId: _payload.userId }, 'ADMIN_QUESTIONS forbidden (missing admin role)');
        return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
    }
    
    const searchParams = _req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    
    const filters = {
        domainId: searchParams.get('domainId') ?? undefined,
        subjectId: searchParams.get('subjectId') ?? undefined,
        topicId: searchParams.get('topicId') ?? undefined,
        subtopicId: searchParams.get('subtopicId') ?? undefined,
        skillIds: searchParams.getAll('skillIds').length > 0 ? searchParams.getAll('skillIds') : undefined,
        status: searchParams.get('status') ?? undefined,
        search: searchParams.get('search') ?? undefined,
    };

    const data = await AdminEngine.getQuestions(page, limit, filters);
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.questions.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.questions.get.duration', durationMs, { outcome: 'success' });
    return NextResponse.json(data, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    log.error({ error: message }, 'ADMIN_QUESTIONS failed');
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.questions.get.failure', 1, { reason: 'internal_error' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.questions.get.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

async function postHandler(_req: NextRequest) {
    const start = Date.now();
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const _payload = await TokenService.verifyAccessToken(_token, true);

    const body = await _req.json() as CreateQuestionInput;
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const result = await AdminEngine.createQuestion(parsed.data, _payload.userId);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'create', outcome: 'success' });
    recordTimer(METRICS.ADMIN.PUBLISH + '.duration', durationMs, { action: 'create', outcome: 'success' });
    
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    log.error({ error: message }, 'ADMIN_QUESTIONS_POST failed');
    recordCounter(METRICS.ADMIN.PUBLISH, 1, { action: 'create', outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_questions' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'create_question' });

