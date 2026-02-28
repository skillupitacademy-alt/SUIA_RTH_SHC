import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import type { DomainInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { domainSchema } from '@/schemas/hierarchy.schemas';

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
    const search = searchParams.get('search') ?? undefined;

    const data = await AdminEngine.getDomains(page, limit, { search });
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.get.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.get.duration', durationMs, { outcome: 'success' });
    return NextResponse.json(data, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.get.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.get.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

async function postHandler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _payload = await verifyAdmin(_req);

    const rawBody = await _req.json();
    const parsed = domainSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    const createBody: DomainInsert = {
      name: body.name,
      description: body.description,
      category: body.category,
      status: body.status,
    };

    const result = await AdminEngine.createDomain(createBody, _payload.userId);
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.create.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.create.duration', durationMs, { outcome: 'success' });
    
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.create.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.domains.create.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_domains' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'create_domain' });
