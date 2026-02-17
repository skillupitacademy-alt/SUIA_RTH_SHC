import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { AuthService } from '@/modules/auth/auth.service';

export const dynamic = 'force-dynamic';

interface ForgotPasswordRequest {
  email?: string;
}

export async function POST(_req: NextRequest) {
  try {
    const { email } = (await _req.json()) as ForgotPasswordRequest;
    
    // Validate inputs
    if (typeof email !== 'string' || email.trim() === '' || !email.includes('@')) {
        // We still return 200 to be perfectly neutral, but we don't proceed
        return NextResponse.json({ success: true });
    }

    const ip = _req.headers.get('x-forwarded-for') ?? '0.0.0.0';
    await AuthService.forgotPassword(email, ip);

    // Per contract: Always return 200 OK (even if email does not exist)
    return NextResponse.json({ success: true });
  } catch (_error: unknown) {
    // Return success to be neutral even on internal errors if we want strict non-disclosure,
    // but typically server errors can be 500 if they don't leak account status.
    // Given the contract "Always return 200 OK", we stay strict.
    logger.error({ err: _error }, 'ForgotPassword.Error');
    return NextResponse.json({ success: true });
  }
}
