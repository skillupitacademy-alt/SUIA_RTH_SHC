import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = await TokenService.verifyAccessToken(token);
    
    await AuthService.touchUserSession(payload.userId);

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[HEARTBEAT] Error:', error.message);
    if (error.message.includes('signature') || error.message.includes('expired') || error.code === 'ERR_JWT_EXPIRED') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
