import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { resolveRequestBrand } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';

    if (userId === '') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const brand = resolveRequestBrand(req.nextUrl.hostname) ?? 'realtutorialhub';
    const ip = getClientIp(req);

    const authService = container.get(AuthService);
    await authService.resendVerification(userId, ip, brand);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_error: unknown) {
    return NextResponse.json({ error: 'Failed to resend verification' }, { status: 500 });
  }
}

export const POST = withCorrelationId(withLogging(handler, { component: 'auth', operation: 'resend_verification' }));
