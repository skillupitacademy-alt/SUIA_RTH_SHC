import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';
import { TokenService } from '@/modules/auth/token.service';

import { CacheManager } from '@/lib/cache-manager';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    
    // 1. Rate Limiting (Hardening)
    // Limit: 60 requests per minute per user
    const { allowed, remaining } = CacheManager.checkRateLimit(payload.userId, 60);
    if (!allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { 
            status: 429, 
            headers: { 
                'Retry-After': '60',
                'X-RateLimit-Remaining': remaining.toString()
            } 
        });
    }

    const range = req.nextUrl.searchParams.get('range') || '7d';
    // 2. Range Validation (Hardening)
    const validRanges = ['7d', '30d'];
    if (!validRanges.includes(range)) {
        return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 });
    }

    const from = req.nextUrl.searchParams.get('from') || undefined;
    const to = req.nextUrl.searchParams.get('to') || undefined;
    
    // Pagination Params
    const rawPage = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const rawLimit = parseInt(req.nextUrl.searchParams.get('limit') || '6');

    // Safety Clamping: Ensure page >= 1 and limit <= 50 (default 6)
    const page = Math.max(rawPage, 1);
    const limit = Math.min(Math.max(rawLimit, 1), 50);

    // 3. Caching (Hardening)
    // Only cache standard range requests (ignore custom from/to for now complexities)
    if (!from && !to) {
        const cached = CacheManager.getDashboard(payload.userId, range, page, limit);
        if (cached) {
            return NextResponse.json(cached, {
                headers: { 'X-Cache': 'HIT', 'X-RateLimit-Remaining': remaining.toString() }
            });
        }
    }

    const data = await DashboardEngine.getUserDashboard(payload.userId, range, from, to, page, limit);
    
    if (!from && !to) {
        CacheManager.setDashboard(payload.userId, range, page, limit, data);
    }
    
    return NextResponse.json(data, {
        headers: { 'X-Cache': 'MISS', 'X-RateLimit-Remaining': remaining.toString() }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

