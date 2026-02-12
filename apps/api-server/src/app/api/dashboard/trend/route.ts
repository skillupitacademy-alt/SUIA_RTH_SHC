import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TrendsService } from '@/modules/metrics/trends.service';
import { TokenService } from '@/modules/auth/token.service';
import { CacheManager } from '@/lib/cache-manager';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: '_user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    
    const range = _req.nextUrl.searchParams.get('range') ?? '7d';
    const validRanges = ['7d', '14d', '28d', '90d'];
    if (!validRanges.includes(range)) {
        return NextResponse.json({ _error: 'Invalid range parameter' }, { status: 400 });
    }

    // Check Cache
    const cached = await CacheManager.getTrend(_payload.userId, range); 
    if (cached !== null && cached !== undefined) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    // Parallel Fetch: Core Trend + Time Machine Delta
    const [trendData, deltaData] = await Promise.all([
        DashboardEngine.getPerformanceTrend(_payload.userId, range),
        TrendsService.getPeriodDelta(_payload.userId, range)
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
    await CacheManager.setTrend(_payload.userId, range, mergedData);

    return NextResponse.json(mergedData, {
        headers: { 'X-Cache': 'MISS' }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
