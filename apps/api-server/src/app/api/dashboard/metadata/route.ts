import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TokenService } from '@/modules/auth/token.service';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const data = await DashboardEngine.getPerformanceBreakdownMetadata(payload.userId);
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
