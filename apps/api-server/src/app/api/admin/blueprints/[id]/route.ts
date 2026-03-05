import type { NextRequest } from 'next/server';

import { internalError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { AdminBlueprintEngine } from "@/modules/admin-engine/admin.blueprint.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw unauthorized('Unauthorized');
    }
    return await container.get(TokenService).verifyAccessToken(_token, true);
}

async function patchHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await _verifyAdmin(_req);
        const rawBody = await _req.json().catch(() => null);
        const result = await AdminBlueprintEngine.updateBlueprint(id, rawBody ?? {});
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return ApiResponse.error(internalError(message), 500);
    }
}

async function deleteHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await _verifyAdmin(_req);
        const result = await AdminBlueprintEngine.deleteBlueprint(id);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return ApiResponse.error(internalError(message), 500);
    }
}

export const PATCH = withLogging(patchHandler, { component: 'admin', operation: 'update_blueprint' });
export const DELETE = withLogging(deleteHandler, { component: 'admin', operation: 'delete_blueprint' });
