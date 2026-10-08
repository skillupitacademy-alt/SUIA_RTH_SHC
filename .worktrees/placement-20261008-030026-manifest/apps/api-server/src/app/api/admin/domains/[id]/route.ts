import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminDomainEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';
import { domainSchema } from '@/schemas/hierarchy.schemas';

async function patchHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _payload = await requireAdminRouteAccess(_req);

    const rawBody = await _req.json();
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
        return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = domainSchema.partial().safeParse(sanitizedBody);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data;
    const result = await AdminDomainEngine.updateDomain(id, body, _payload.userId);
    if (result?.id !== undefined) {
      void HierarchySyncService.sync('domain', result.id);
    }
    
    return ApiResponse.success(result);
  } catch (_error: unknown) {
    return ApiResponse.error(_error);
  }
}

async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _payload = await requireAdminRouteAccess(_req);

    const result = await AdminDomainEngine.deleteDomain(id, _payload.userId);
    return ApiResponse.success(result);
  } catch (_error: unknown) {
    return ApiResponse.error(_error);
  }
}

export const PATCH = withCorrelationId(withLogging(patchHandler, { component: 'admin', operation: 'update_domain' }));
export const DELETE = withCorrelationId(withLogging(deleteHandler, { component: 'admin', operation: 'delete_domain' }));
