import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { BlueprintInsert } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { blueprintSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return { _error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const _payload = await TokenService.verifyAccessToken(_token, true);
        return { userId: _payload.userId };
    } catch {
        return { _error: 'Unauthorized', status: 401 };
    }
}

export async function GET(_req: NextRequest) {
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const searchParams = _req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '20');
        const search = searchParams.get('search') ?? undefined;

        const data = await AdminEngine.getBlueprints(page, limit, { search });
        return NextResponse.json(data);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_BLUEPRINTS_GET] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export async function POST(_req: NextRequest) {
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const rawBody = await _req.json() as BlueprintInsert;
        const parsed = blueprintSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
        }

        // AdminEngine.createBlueprint(data) - only 1 arg
        const result = await AdminEngine.createBlueprint(parsed.data);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_BLUEPRINTS_POST] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}
