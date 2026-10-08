import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { badRequest, validationError } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { withObservability } from '@/middleware/observability.middleware';
import { getClientIp } from '@/modules/auth/client-ip';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';
import { SHCAuthService } from '@/modules/auth/shc-auth.service';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/shc/auth/login
 * 
 * Login endpoint for SkillHub Core infrastructure admins.
 * 
 * SHC admins manage shared services (Exam Engine, Tutorial Engine, etc.)
 * used by RTH and SUI. They authenticate against people_db.
 */
async function handler(req: NextRequest) {
  console.log('[SHC_AUTH] Login request received');

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      console.log('[SHC_AUTH] Validation failed:', parsed.error.issues);
      return ApiResponse.error(validationError(parsed.error.issues));
    }

    const { email, password } = parsed.data;
    const ip = getClientIp(req);

    console.log('[SHC_AUTH] Attempting login:', { email, ip });

    const shcAuthService = new SHCAuthService();
    const result = await shcAuthService.login(email, password, ip);

    console.log('[SHC_AUTH] Login successful:', { userId: result.user.id, role: result.user.role });

    // Return tokens in response body
    // The SHC admin app proxy will handle setting cookies
    const response = ApiResponse.success({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    // Set CSRF token for subsequent requests
    const requestHostname = resolveRequestHostnameFromHeaders(req.headers, req.nextUrl.hostname);
    setCsrfToken(response, requestHostname);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('[SHC_AUTH] Login error:', message);
    return ApiResponse.error(badRequest(message));
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const POST = withObservability(
  withCorrelationId(
    withLogging(handler, { component: 'shc-auth', operation: 'login' })
  )
);
