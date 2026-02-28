import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { resetPasswordSchema } from '@/schemas/auth.schemas';

export const dynamic = 'force-dynamic';

async function getHandler(_req: NextRequest) {
    const _token = _req.nextUrl.searchParams.get('_token');
    if (typeof _token !== 'string' || _token.trim() === '') {
        return NextResponse.json({ valid: false }, { status: 400 });
    }

    try {
        const valid = await AuthService.validateResetToken(_token);
        return NextResponse.json({ valid });
    } catch {
        return NextResponse.json({ valid: false });
    }
}

async function postHandler(_req: NextRequest) {
  try {
    const rawBody = await _req.json();
    const parsed = resetPasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const { token, password } = parsed.data;

    const ip = _req.headers.get('x-forwarded-for') ?? '0.0.0.0';
    await AuthService.resetPassword(token, password, ip);

    return NextResponse.json({ success: true });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Error resetting password';
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}

export const GET = withLogging(getHandler, { component: 'auth', operation: 'validate_reset_token' });
export const POST = withLogging(postHandler, { component: 'auth', operation: 'reset_password' });
