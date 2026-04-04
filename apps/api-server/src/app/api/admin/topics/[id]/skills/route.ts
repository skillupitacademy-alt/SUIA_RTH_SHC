import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { AdminSkillEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

async function getHandler(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await requireAdminRouteAccess(_req);

        const data = await AdminSkillEngine.getSkillsByTopic(id);
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
        const _payload = await requireAdminRouteAccess(_req);

        const body = await _req.json(); 
        const result = await AdminSkillEngine.mapTopicToSkills(id, body.skillIds, _payload.userId);
        
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_topic_skills' });
export const POST = withLogging(postHandler, { component: 'admin', operation: 'map_topic_skills' });
