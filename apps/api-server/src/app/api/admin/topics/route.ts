import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import type { TopicInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { topicSchema } from '@/schemas/hierarchy.schemas';

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
  const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
  if (_token === null || _token === undefined || _token.trim() === '') {
    throw new Error('Unauthorized');
  }
  return await TokenService.verifyAccessToken(_token, true);
}

async function getHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    await verifyAdmin(_req);

    const searchParams = _req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const subjectId = searchParams.get('subjectId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const data = await AdminEngine.getTopics(page, limit, { subjectId, search });
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.get.duration', durationMs, { outcome: 'success' });
    return NextResponse.json(data, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.get.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

async function postHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _payload = await verifyAdmin(_req);

    if (!(await _verifyAdmin(_payload))) {
        return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
    }

    const rawBody = await _req.json();
    const parsed = topicSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    const createBody: TopicInsert = {
      subjectId: body.subjectId,
      name: body.name,
      description: body.description,
      status: body.status,
      complexityLevel: typeof body.complexityLevel === 'number' ? body.complexityLevel : undefined,
      weight: typeof body.weight === 'number' ? body.weight : undefined,
      learningUrl: body.learningUrl,
      detailedNotesPath: body.detailedNotesPath,
    };

    const result = await AdminEngine.createTopic(createBody, _payload.userId);
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.create.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.create.duration', durationMs, { outcome: 'success' });
    
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topics.create.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_topics' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'create_topic' });
