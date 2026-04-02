import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { getBrandConfig } from '@/lib/brand-config';
import { resolveRequestBrandFromHeaders, type RequestBrand } from '@/lib/request-brand';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

interface VerifyEmailRequest {
  token?: string;
  platform?: RequestBrand;
  brand?: RequestBrand;
}

async function handler(req: NextRequest) {
  try {
    const rawBody = await req.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as VerifyEmailRequest;
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (token.length === 0) {
      return ApiResponse.error(badRequest('Token is required'));
    }

    const brand = body.brand ?? body.platform ?? resolveRequestBrandFromHeaders(req.headers, req.nextUrl.hostname) ?? 'realtutorialhub';
    const ip = getClientIp(req);
    await container.get(AuthService).verifyEmail(token, ip, brand);

    return ApiResponse.success({ success: true, redirectUrl: getBrandConfig(brand).verificationSuccessUrl });
  } catch (error: unknown) {
    return ApiResponse.error(error, 400);
  }
}

export const POST = withLogging(handler, { component: 'auth', operation: 'verify_email' });
