import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import type { BlueprintInsert } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return { _error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const _payload = await TokenService.verifyAccessToken(_token, true);
        return { userId: _payload.userId };
    } catch (_err) {
        return { _error: 'Unauthorized', status: 401 };
    }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        const body = await _req.json() as Partial<BlueprintInsert>;
        // AdminEngine.updateBlueprint(id, data) - 2 args
        const result = await AdminEngine.updateBlueprint(id, body);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_BLUEPRINT_PATCH] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error, scope: auth.scope }, { status: auth.status });

    try {
        // AdminEngine.deleteBlueprint(id) - 1 arg
        const result = await AdminEngine.deleteBlueprint(id);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_BLUEPRINT_DELETE] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}
