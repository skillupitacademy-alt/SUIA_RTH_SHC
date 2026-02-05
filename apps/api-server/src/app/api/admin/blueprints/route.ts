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

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error, scope: auth.scope }, { status: auth.status });

    try {
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || undefined;

        const data = await AdminEngine.getBlueprints(page, limit, { search });
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[ADMIN_BLUEPRINTS_GET] Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error, scope: auth.scope }, { status: auth.status });

    try {
        const body = await req.json();
        // AdminEngine.createBlueprint(data) - only 1 arg
        const result = await AdminEngine.createBlueprint(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[ADMIN_BLUEPRINTS_POST] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
