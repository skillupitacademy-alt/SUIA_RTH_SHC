import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TokenService } from '@/modules/auth/token.service';
import { CacheManager } from '@/lib/cache-manager';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: '_user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: '_user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    
    // 1. Rate Limiting (Hardening)
    const { allowed, remaining } = CacheManager.checkRateLimit(_payload.userId, 60);
    if (allowed === false) {
        return NextResponse.json({ _error: 'Too many requests' }, { 
            status: 429, 
            headers: { 
                'Retry-After': '60',
                'X-RateLimit-Remaining': remaining.toString()
            } 
        });
    }

    const range = _req.nextUrl.searchParams.get('range') ?? '7d';
    // 2. Range Validation (Hardening)
    const validRanges = ['7d', '14d', '28d', '90d'];
    if (!validRanges.includes(range)) {
        return NextResponse.json({ _error: 'Invalid range parameter' }, { status: 400 });
    }

    const from = _req.nextUrl.searchParams.get('from') ?? undefined;
    const to = _req.nextUrl.searchParams.get('to') ?? undefined;
    
    // Pagination Params
    const rawPage = parseInt(_req.nextUrl.searchParams.get('page') ?? '1', 10);
    const rawLimit = parseInt(_req.nextUrl.searchParams.get('limit') ?? '6', 10);

    // Safety Clamping
    const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 1 : rawLimit, 1), 50);

    // 3. Caching (Hardening)
    if (typeof from !== 'string' && typeof to !== 'string') {
        const cached = CacheManager.getDashboard(_payload.userId, range, page, limit);
        if (cached !== null && cached !== undefined) {
            return NextResponse.json(cached, {
                headers: { 'X-Cache': 'HIT', 'X-RateLimit-Remaining': remaining.toString() }
            });
        }
    }

    const data = await DashboardEngine.getUserDashboard(_payload.userId, range, from, to, page, limit);
    
    if (typeof from !== 'string' && typeof to !== 'string') {
        CacheManager.setDashboard(_payload.userId, range, page, limit, data);
    }
    
    return NextResponse.json(data, {
        headers: { 'X-Cache': 'MISS', 'X-RateLimit-Remaining': remaining.toString() }
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    return NextResponse.json({ _error: message }, { status: 500 });
  }
}
