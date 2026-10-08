import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { resolveRequestBrand, resolveRequestBrandFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { container } from '@/modules/core/container';
import { loginSchema } from '@/schemas/auth.schemas';

export const dynamic = 'force-dynamic';

import { withCorrelationId } from '@/lib/correlation-id.middleware';

async function handler(req: NextRequest) {
  const debugInfo: {
    timestamp: string;
    steps: string[];
    request?: Record<string, unknown>;
    loginData?: Record<string, unknown>;
    validationError?: unknown;
    error?: string;
    loginResult?: Record<string, unknown>;
    loginError?: Record<string, unknown>;
    handlerError?: Record<string, unknown>;
  } = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    const requestId = req.headers.get('x-request-id') ?? 'no-request-id';
    const origin = req.headers.get('origin') ?? 'unknown';
    const host = req.headers.get('host') ?? req.nextUrl.hostname;
    
    debugInfo.request = {
      requestId,
      host,
      origin,
      path: req.nextUrl.pathname,
    };
    debugInfo.steps.push('Request received');

    const rawBody = await req.json();
    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      debugInfo.steps.push('Validation failed');
      debugInfo.validationError = parsed.error.issues;
      return ApiResponse.success({ debug: debugInfo, success: false, error: 'Validation failed' });
    }
    
    const { email, password, platform } = parsed.data;
    const ip = getClientIp(req);
    const brand = resolveRequestBrand(platform) ?? resolveRequestBrandFromHeaders(req.headers);

    debugInfo.loginData = {
      email,
      platform,
      resolvedBrand: brand,
      ip,
      host: req.headers.get('host'),
      origin: req.headers.get('origin')
    };
    debugInfo.steps.push('Login data parsed');

    if (brand !== 'skillup' && brand !== 'realtutorialhub') {
      debugInfo.steps.push('Brand validation failed');
      debugInfo.error = 'Invalid brand';
      return ApiResponse.success({ debug: debugInfo, success: false, error: 'Brand is required' });
    }

    debugInfo.steps.push('Brand validation passed');

    // Try the login and capture any errors
    try {
      const { _user, accessToken, refreshToken, isAdmin } = await container.get(AuthService).login(email, password, ip, brand);
      
      debugInfo.steps.push('Login successful');
      debugInfo.loginResult = {
        userId: _user.id,
        email: _user.email,
        isAdmin,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      };

      return ApiResponse.success({ 
        debug: debugInfo, 
        success: true, 
        message: 'Login would succeed',
        user: {
          id: _user.id,
          email: _user.email,
          isAdmin
        }
      });

    } catch (loginError) {
      debugInfo.steps.push('Login failed');
      debugInfo.loginError = {
        message: loginError instanceof Error ? loginError.message : 'Unknown error',
        name: loginError instanceof Error ? loginError.name : 'Unknown',
        stack: loginError instanceof Error ? loginError.stack?.split('\n').slice(0, 5) : undefined
      };

      return ApiResponse.success({ 
        debug: debugInfo, 
        success: false, 
        error: 'Login failed',
        details: debugInfo.loginError
      });
    }

  } catch (error) {
    debugInfo.steps.push('Handler error');
    debugInfo.handlerError = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown'
    };

    return ApiResponse.success({ 
      debug: debugInfo, 
      success: false, 
      error: 'Handler error',
      details: debugInfo.handlerError
    });
  }
}

export const POST = withCorrelationId(
  withLogging(handler, { component: 'debug', operation: 'login' })
);