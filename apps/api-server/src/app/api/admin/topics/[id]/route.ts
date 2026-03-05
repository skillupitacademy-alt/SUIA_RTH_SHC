import type { NextRequest } from 'next/server';

import { badRequest, forbidden, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { topicSchema } from '@/schemas/hierarchy.schemas';

async function patchHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token === '') {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }
    
    const _payload = await TokenService.verifyAccessToken(_token, true);

    const rawBody = await _req.json();
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = topicSchema.partial().safeParse(sanitizedBody);
    
    if (!parsed.success) {
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const body = parsed.data;
    const result = await AdminEngine.updateTopic(id, body, _payload.userId);
    
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
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token === '') {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }
    
    const _payload = await TokenService.verifyAccessToken(_token, true);

    if (!(await _verifyAdmin(_payload))) {
      return ApiResponse.error(forbidden());
    }

    const result = await AdminEngine.deleteTopic(id, _payload.userId);
    return ApiResponse.success(result);
  } catch (_error: unknown) {
    return ApiResponse.error(_error);
  }
}

export const PATCH = withLogging(patchHandler, { component: 'admin', operation: 'update_topic' });
export const DELETE = withLogging(deleteHandler, { component: 'admin', operation: 'delete_topic' });
