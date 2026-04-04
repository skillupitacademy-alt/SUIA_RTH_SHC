import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminSubjectEngine } from "@/modules/admin-engine/admin.engine";
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { HierarchySyncService } from '@/modules/hierarchy/hierarchy-sync.service';
import { subjectSchema } from '@/schemas/hierarchy.schemas';

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
    const parsed = subjectSchema.partial().safeParse(sanitizedBody);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data;
    const result = await AdminSubjectEngine.updateSubject(id, body, _payload.userId);
    if (result?.id !== undefined) {
      void HierarchySyncService.sync('subject', result.id);
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

    const result = await AdminSubjectEngine.deleteSubject(id, _payload.userId);
    return ApiResponse.success(result);
  } catch (_error: unknown) {
    return ApiResponse.error(_error);
  }
}

export const PATCH = withCorrelationId(withLogging(patchHandler, { component: 'admin', operation: 'update_subject' }));
export const DELETE = withCorrelationId(withLogging(deleteHandler, { component: 'admin', operation: 'delete_subject' }));
