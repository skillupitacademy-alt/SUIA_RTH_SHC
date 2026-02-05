import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function verifyAdmin(req: NextRequest) {
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (!token) {
        return { error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const payload = await TokenService.verifyAccessToken(token, true);
        return { userId: payload.userId };
    } catch (err) {
        return { error: 'Unauthorized', status: 401 };
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error, scope: auth.scope }, { status: auth.status });

    try {
        const body = await req.json();
        // AdminEngine.updateBlueprint(id, data) - 2 args
        const result = await AdminEngine.updateBlueprint(id, body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[ADMIN_BLUEPRINT_PATCH] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error, scope: auth.scope }, { status: auth.status });

    try {
        // AdminEngine.deleteBlueprint(id) - 1 arg
        const result = await AdminEngine.deleteBlueprint(id);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[ADMIN_BLUEPRINT_DELETE] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
