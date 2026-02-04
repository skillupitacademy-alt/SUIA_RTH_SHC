
import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';
import { AuthService } from '@/modules/auth/auth.service';

export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
        // Try verifying as normal user first
        payload = await TokenService.verifyAccessToken(token);
    } catch {
        // Fallback or explicit failure
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!payload?.userId) {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    await AuthService.heartbeat(payload.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Heartbeat failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
