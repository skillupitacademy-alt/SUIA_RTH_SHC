import { redirect } from 'next/navigation';

import { fetchBackendAuthState } from '../../../../../src/share-branding/auth/serverAuthState';
import DashboardPage from '../../../../../src/share-branding/DashboardPage';
import { loadDashboardData } from '../../../../../src/share-branding/dashboardPageData';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Dashboard | RealTutorialHub',
  description: 'Your RealTutorialHub Engine Command Center.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const authState = await fetchBackendAuthState();
  
  // ✅ CRITICAL: Redirect to login if not authenticated
  if (!authState) {
    redirect('/login');
  }
  
  // ✅ Redirect to onboarding if not completed
  if (authState.onboardingCompleted === false) {
    redirect('/onboarding');
  }
  
  try {
    const data = await loadDashboardData(rthConfig, authState);
    return <DashboardPage config={rthConfig} data={data} />;
  } catch (error) {
    console.error('[RTH_DASHBOARD] Error loading dashboard data:', error);
    // If dashboard data loading fails, redirect to login
    redirect('/login');
  }
}
