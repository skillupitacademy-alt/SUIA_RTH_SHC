import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { DomainInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { domainSchema } from '@/schemas/hierarchy.schemas';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    await TokenService.verifyAccessToken(_token, true);
    
    const searchParams = _req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const search = searchParams.get('search') ?? undefined;

    const data = await AdminEngine.getDomains(page, limit, { search });
    return NextResponse.json(data);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_DOMAINS_GET] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
    }
    const _payload = await TokenService.verifyAccessToken(_token, true);

    const rawBody = await _req.json();
    const parsed = domainSchema.safeParse(rawBody);
    const body = parsed.success ? parsed.data : (rawBody as Partial<typeof domainSchema['_input']>);

    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ _error: 'name is required' }, { status: 400 });
    }

    const createBody: DomainInsert = {
      name: body.name,
      description: body.description,
      category: body.category,
      status: body.status,
    };

    const result = await AdminEngine.createDomain(createBody, _payload.userId);
    
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    console.error('[ADMIN_DOMAINS_POST] Error:', message);
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
