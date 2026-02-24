import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';
import { DashboardEngine } from '@/modules/dashboard-engine/dashboard.engine';

export const dynamic = 'force-dynamic';

/**
 * TEMPORARY DEBUG ENDPOINT
 * Runs the exact same dashboard query and returns the raw result/error.
 * 
 * TODO: REMOVE after debugging is complete.
 */
export async function GET(_req: NextRequest) {
  try {
    const userToken = _req.cookies.get('accessToken')?.value;
    const adminToken = _req.cookies.get('admin_accessToken')?.value;
    const infraToken = _req.cookies.get('infra_accessToken')?.value;
    
    const result: Record<string, unknown> = {
      cookies: {
        hasAccessToken: typeof userToken === 'string' && userToken !== '',
        hasAdminAccessToken: typeof adminToken === 'string' && adminToken !== '',
        hasInfraAccessToken: typeof infraToken === 'string' && infraToken !== '',
      },
      timestamp: new Date().toISOString()
    };

    if (typeof userToken === 'string' && userToken !== '') {
      try {
        const payload = await TokenService.verifyAccessToken(userToken, false);
        result.userTokenPayload = {
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles,
          aud: payload.aud,
        };

        // Now run the EXACT same query as the dashboard route
        try {
          const dashboardData = await DashboardEngine.getUserDashboard(
            payload.userId, '7d', undefined, undefined, 1, 6
          );
          result.dashboardQuery = {
            status: 'SUCCESS',
            overview: dashboardData.overview,
            recentActivityCount: dashboardData.recentActivity.length,
            firstActivity: dashboardData.recentActivity[0] ?? null,
            pagination: dashboardData.pagination,
            trendCount: dashboardData.performanceTrend.length,
          };
        } catch (dbErr) {
          result.dashboardQuery = {
            status: 'ERROR',
            error: dbErr instanceof Error ? dbErr.message : 'Unknown DB error',
            stack: dbErr instanceof Error ? dbErr.stack?.split('\n').slice(0, 5) : undefined,
          };
        }
      } catch (err) {
        result.userTokenError = err instanceof Error ? err.message : 'Failed to verify';
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
