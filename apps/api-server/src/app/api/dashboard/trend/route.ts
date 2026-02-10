import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TrendsService } from '@/modules/metrics/trends.service';
import { TokenService } from '@/modules/auth/token.service';
import { CacheManager } from '@/lib/cache-manager';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    
    const range = req.nextUrl.searchParams.get('range') || '7d';
    const validRanges = ['7d', '14d', '28d', '90d'];
    if (!validRanges.includes(range)) {
        return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 });
    }

    // Check Cache
    const cached = await CacheManager.getTrend(payload.userId, range); // Ensure async
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    // Parallel Fetch: Core Trend + Time Machine Delta
    const [trendData, deltaData] = await Promise.all([
        DashboardEngine.getPerformanceTrend(payload.userId, range),
        TrendsService.getPeriodDelta(payload.userId, range)
    ]);

    // Compute Health
    const healthStatus = TrendsService.getExecHealth(trendData.averageScore, deltaData?.deltaPct ?? null);

    const mergedData = {
        ...trendData,
        currentAvg: deltaData?.currentAvg ?? null,
        previousAvg: deltaData?.previousAvg ?? null,
        deltaPct: deltaData?.deltaPct ?? null,
        healthStatus
    };
    
    // Set Cache (TTL 60s)
    await CacheManager.setTrend(payload.userId, range, mergedData);

    return NextResponse.json(mergedData, {
        headers: { 'X-Cache': 'MISS' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
