import type { BrandConfig } from './brandConfig';
import { fetchBackendAuthState } from './auth/serverAuthState';
import { loadDashboardData } from './dashboardPageData';
import { getMinimalDashboardData } from './dashboardMinimalData';
import type { DashboardViewData } from './dashboardPageData';

/**
 * 🔥 PHASE 1: DASHBOARD DATA RESOLVER
 * 
 * Single source of truth for dashboard data loading with fallback
 * 
 * ARCHITECTURE:
 * 1. Try to fetch user profile (optional)
 * 2. If user exists, try full dashboard data
 * 3. On any failure, return pure minimal fallback
 * 
 * GUARANTEES:
 * ✅ Always returns valid DashboardViewData
 * ✅ Never throws errors
 * ✅ Never causes logout on data failure
 */
export async function resolveDashboardData(config: BrandConfig): Promise<DashboardViewData> {
  const user = await fetchBackendAuthState().catch(() => null);
  
  if (!user) {
    console.warn('[DASHBOARD_RESOLVER] No profile data, using minimal dashboard');
    return getMinimalDashboardData(config);
  }
  
  try {
    return await loadDashboardData(config, user);
  } catch (error) {
    console.error('[DASHBOARD_RESOLVER] Full data load failed, using minimal dashboard:', error);
    return getMinimalDashboardData(config);
  }
}
