import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';

export const dynamic = 'force-dynamic';

interface ForgotPasswordRequest {
  email?: string;
}

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const { email } = (await _req.json()) as ForgotPasswordRequest;
    
    if (typeof email !== 'string' || email.trim() === '' || !email.includes('@')) {
        return NextResponse.json({ success: true });
    }

    const ip = _req.headers.get('x-forwarded-for') ?? '0.0.0.0';
    await AuthService.forgotPassword(email, ip);

    recordCounter(METRICS.AUTH.FAILURE, 1, { operation: 'forgot_password', outcome: 'success' });
    recordTimer(METRICS.AUTH.FAILURE + '.forgot_password.duration', Date.now() - start, { outcome: 'success' });

    return NextResponse.json({ success: true });
  } catch (_error: unknown) {
    recordCounter(METRICS.AUTH.FAILURE, 1, { operation: 'forgot_password', outcome: 'failure' });
    return NextResponse.json({ success: true });
  }
}

export const POST = withLogging(handler, { component: 'auth', operation: 'forgot_password' });
