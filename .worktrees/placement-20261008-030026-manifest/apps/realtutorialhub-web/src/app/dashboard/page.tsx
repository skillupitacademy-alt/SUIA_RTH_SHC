import { redirect } from 'next/navigation';

import { validateAuthState } from '../../../../../src/share-branding/auth/validateAuthState';
import DashboardPage from '../../../../../src/share-branding/DashboardPage';
import { resolveDashboardData } from '../../../../../src/share-branding/dashboardResolver';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Dashboard | RealTutorialHub',
  description: 'Your RealTutorialHub Engine Command Center.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  // 🔥 STEP 1: LIGHTWEIGHT AUTH VALIDATION (FAST)
  console.log('[DASHBOARD_SSR] Validating auth...');
  
  const auth = await validateAuthState();
  
  console.log('[DASHBOARD_SSR] Auth validation result:', {
    isAuthenticated: !!auth,
    userId: auth?.id?.slice(0, 8),
    onboardingCompleted: auth?.onboardingCompleted,
    roles: auth?.roles,
  });
  
  // ✅ CRITICAL: Redirect to login if not authenticated
  if (!auth) {
    console.log('[DASHBOARD_SSR] Not authenticated, redirecting to login');
    redirect('/login');
  }
  
  // ✅ Redirect to onboarding if not completed
  if (auth.onboardingCompleted === false) {
    console.log('[DASHBOARD_SSR] Onboarding not completed, redirecting');
    redirect('/onboarding');
  }
  
  // 🔥 STEP 2: LOAD DASHBOARD DATA (GUARANTEED TO RETURN)
  console.log('[DASHBOARD_SSR] Auth confirmed, loading dashboard data...');
  
  const data = await resolveDashboardData(rthConfig);
  
  return <DashboardPage config={rthConfig} data={data} />;
}
