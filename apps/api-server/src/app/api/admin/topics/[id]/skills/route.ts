import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { _verifyAdmin } from '@/modules/auth/rbac.service';

export const dynamic = 'force-dynamic';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
        if (_token === null || _token === undefined || _token.trim() === '') {
            return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
        }

        const _payload = await TokenService.verifyAccessToken(_token, true);

        if (!(await _verifyAdmin(_payload))) {
            return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
        }

        const data = await AdminEngine.getSkillsByTopic(id);
        return NextResponse.json(data);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[TOPIC_SKILLS_GET] Error:', message);
        return NextResponse.json({ _error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
        if (_token === null || _token === undefined || _token.trim() === '') {
            return NextResponse.json({ _error: 'Unauthorized', scope: 'admin' }, { status: 401 });
        }

        const _payload = await TokenService.verifyAccessToken(_token, true);

        if (!(await _verifyAdmin(_payload))) {
            return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
        }

        const body = await _req.json(); // Expected { skillIds: string[] }
        const result = await AdminEngine.mapTopicToSkills(id, body.skillIds, _payload.userId);
        
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[TOPIC_SKILLS_POST] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}
