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
    
    const range = req.nextUrl.searchParams.get('range') || '28d';
    const validRanges = ['7d', '14d', '28d', '90d'];
    if (!validRanges.includes(range)) {
        return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 });
    }

    // Use specialized breakdown cache
    const cached = CacheManager.getBreakdown(payload.userId, range);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    const data = await DashboardEngine.getPerformanceBreakdown(payload.userId, range);
    
    CacheManager.setBreakdown(payload.userId, range, data);

    return NextResponse.json(data, {
        headers: { 'X-Cache': 'MISS' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
