import type { NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  try {
    const tokenService = container.get(TokenService);
    const authService = container.get(AuthService);

    const _token = tokenService.getAccessToken(_req);
    if (typeof _token !== 'string' || _token.trim() === '') {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await tokenService.verifyAccessToken(_token, false);
    
    await authService.heartbeat(_payload.userId);

    return ApiResponse.success({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 401);
  }
}

export const POST = withLogging(handler, { component: 'auth', operation: 'heartbeat' });
