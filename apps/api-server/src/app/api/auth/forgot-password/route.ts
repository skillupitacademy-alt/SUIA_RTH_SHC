import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

interface ForgotPasswordRequest {
  email?: string;
}

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const rawBody = await _req.json();
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
        return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const { email } = sanitizeJsonField(rawBody) as ForgotPasswordRequest;
    
    if (typeof email !== 'string' || email.trim() === '' || !email.includes('@')) {
        return ApiResponse.success({ success: true });
    }

    const ip = _req.headers.get('x-forwarded-for') ?? '0.0.0.0';
    await container.get(AuthService).forgotPassword(email, ip);

    recordCounter(METRICS.AUTH.FAILURE, 1, { operation: 'forgot_password', outcome: 'success' });
    recordTimer(METRICS.AUTH.FAILURE + '.forgot_password.duration', Date.now() - start, { outcome: 'success' });

    return ApiResponse.success({ success: true });
  } catch (_error: unknown) {
    recordCounter(METRICS.AUTH.FAILURE, 1, { operation: 'forgot_password', outcome: 'failure' });
    return ApiResponse.success({ success: true });
  }
}

export const POST = withLogging(handler, { component: 'auth', operation: 'forgot_password' });
