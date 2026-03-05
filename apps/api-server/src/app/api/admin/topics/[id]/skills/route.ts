import type { NextRequest } from 'next/server';

import { forbidden, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

async function verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw unauthorized('Unauthorized', 'UNAUTHORIZED');
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
            return ApiResponse.error(forbidden());
        }

        const data = await AdminEngine.getSkillsByTopic(id);
        return ApiResponse.success(data);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
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
            return ApiResponse.error(forbidden());
        }

        const body = await _req.json(); 
        const result = await AdminEngine.mapTopicToSkills(id, body.skillIds, _payload.userId);
        
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_topic_skills' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'map_topic_skills' });
