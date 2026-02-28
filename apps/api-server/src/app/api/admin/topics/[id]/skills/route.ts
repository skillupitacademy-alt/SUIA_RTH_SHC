import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw new Error('Unauthorized');
    }
    return await TokenService.verifyAccessToken(_token, true);
}

async function getHandler(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const _payload = await verifyAdmin(_req);

        if (!(await _verifyAdmin(_payload))) {
            return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
        }

        const data = await AdminEngine.getSkillsByTopic(id);
        return NextResponse.json(data);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

async function postHandler(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const _payload = await verifyAdmin(_req);

        if (!(await _verifyAdmin(_payload))) {
            return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
        }

        const body = await _req.json(); 
        const result = await AdminEngine.mapTopicToSkills(id, body.skillIds, _payload.userId);
        
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_topic_skills' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'map_topic_skills' });
