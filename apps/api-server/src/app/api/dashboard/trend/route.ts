import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TokenService } from '@/modules/auth/token.service';
import { CacheManager } from '@/lib/cache-manager';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    
    const range = req.nextUrl.searchParams.get('range') || '7d';
    const validRanges = ['7d', '14d', '28d', '30d', '90d'];
    if (!validRanges.includes(range)) {
        return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 });
    }

    // cache-manager likely needs an update to support trend cache keys specifically
    // for now we use the general setDashboard or a custom key
    const data = await DashboardEngine.getPerformanceTrend(payload.userId, range);
    
    return NextResponse.json(data, {
        headers: { 'X-Cache': 'MISS' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
