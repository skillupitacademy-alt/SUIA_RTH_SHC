import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'admin' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, true); // true for isAdmin check
    
    const metrics = await AdminEngine.getPlatformMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

