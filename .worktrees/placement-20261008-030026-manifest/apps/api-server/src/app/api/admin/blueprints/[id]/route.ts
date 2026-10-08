import type { NextRequest } from "next/server";

import { badRequest } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { withLogging } from "@/lib/withLogging";
import { AdminBlueprintEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from "@/modules/auth/admin-audience.util";
import { blueprintSchema } from "@/schemas/admin.schemas";

export const dynamic = 'force-dynamic';

async function patchHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await requireAdminRouteAccess(_req);
        const rawBody = await _req.json().catch(() => null);
        
        const parsed = blueprintSchema.partial().safeParse(rawBody ?? {});
        if (!parsed.success) {
            return ApiResponse.error(badRequest('Invalid payload'), 400);
        }

        const result = await AdminBlueprintEngine.updateBlueprint(id, parsed.data);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

async function deleteHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await requireAdminRouteAccess(_req);
        const result = await AdminBlueprintEngine.deleteBlueprint(id);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

export const PATCH = withLogging(patchHandler, { component: 'admin', operation: 'update_blueprint' });
export const DELETE = withLogging(deleteHandler, { component: 'admin', operation: 'delete_blueprint' });
