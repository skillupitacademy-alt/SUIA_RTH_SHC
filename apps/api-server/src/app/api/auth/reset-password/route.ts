import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { resolveRequestBrandFromHeaders } from '@/lib/request-brand';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { container } from '@/modules/core/container';
import { resetPasswordSchema } from '@/schemas/auth.schemas';

export const dynamic = 'force-dynamic';

async function getHandler(_req: NextRequest) {
    const _token = _req.nextUrl.searchParams.get('_token');
    if (typeof _token !== 'string' || _token.trim() === '') {
        return ApiResponse.error(badRequest('Token is required'));
    }

    try {
        const brand = resolveRequestBrandFromHeaders(_req.headers, _req.nextUrl.hostname);
        if (brand !== 'skillup' && brand !== 'realtutorialhub') {
            return ApiResponse.error(badRequest('Brand is required'));
        }
        const valid = await container.get(AuthService).validateResetToken(_token, brand);
        return ApiResponse.success({ valid });
    } catch {
        return ApiResponse.success({ valid: false });
    }
}

async function postHandler(_req: NextRequest) {
  try {
    const rawBody = await _req.json();
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = resetPasswordSchema.safeParse(sanitizedBody);
    
    if (!parsed.success) {
        return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const { token, password } = parsed.data;
    const platform = typeof sanitizedBody === 'object' && sanitizedBody !== null && 'platform' in sanitizedBody
      ? (sanitizedBody as { platform?: string }).platform
      : undefined;

    const ip = getClientIp(_req);
    const brand = platform === 'skillup' || platform === 'realtutorialhub'
      ? platform
      : resolveRequestBrandFromHeaders(_req.headers, _req.nextUrl.hostname);
    if (brand !== 'skillup' && brand !== 'realtutorialhub') {
      return ApiResponse.error(badRequest('Brand is required'));
    }
    await container.get(AuthService).resetPassword(token, password, ip, brand);

    return ApiResponse.success({ success: true });
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 400);
  }
}

export const GET = withLogging(getHandler, { component: 'auth', operation: 'validate_reset_token' });
export const POST = withLogging(postHandler, { component: 'auth', operation: 'reset_password' });
