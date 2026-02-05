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

export async function POST(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error, scope: auth.scope }, { status: auth.status });

    try {
        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }

        const result = await AdminEngine.deleteSkillsBatch(ids, auth.userId!);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[ADMIN_SKILLS_BATCH_DELETE] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
