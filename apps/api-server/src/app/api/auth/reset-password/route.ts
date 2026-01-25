import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ valid: false }, { status: 400 });

    try {
        const valid = await AuthService.validateResetToken(token);
        return NextResponse.json({ valid });
    } catch (error) {
        return NextResponse.json({ valid: false });
    }
}

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    
    if (!token || !newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    await AuthService.resetPassword(token, newPassword, ip);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reset password route error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
