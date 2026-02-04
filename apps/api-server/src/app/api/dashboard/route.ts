import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TokenService } from '@/modules/auth/token.service';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const range = req.nextUrl.searchParams.get('range') || '7d';
    const from = req.nextUrl.searchParams.get('from') || undefined;
    const to = req.nextUrl.searchParams.get('to') || undefined;
    const data = await DashboardEngine.getUserDashboard(payload.userId, range, from, to);
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

