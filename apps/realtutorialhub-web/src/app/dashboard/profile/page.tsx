import { redirect } from 'next/navigation';

import { fetchBackendAuthState } from '../../../../../../src/share-branding/auth/serverAuthState';
import DashboardProfilePage from '../../../../../../src/share-branding/DashboardProfilePage';
import { loadDashboardData } from '../../../../../../src/share-branding/dashboardPageData';
import { rthConfig } from '../../../../../../src/share-branding/brandConfig';
import { ErrorBoundary } from '../../../../../../src/share-branding/components/ErrorBoundary';

export const metadata = {
  title: 'Profile | RealTutorialHub',
  description: 'Manage your RealTutorialHub profile and learning preferences.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  console.log('[PROFILE_PAGE] Starting page render');
  
  let authState;
  try {
    authState = await fetchBackendAuthState();
    console.log('[PROFILE_PAGE] Auth state fetched:', {
      hasAuthState: !!authState,
      userId: authState?.id,
      email: authState?.email,
      onboardingCompleted: authState?.onboardingCompleted
    });
  } catch (error) {
    console.error('[PROFILE_PAGE] Error fetching auth state:', error);
    redirect('/login');
  }
  
  if (!authState) {
    console.log('[PROFILE_PAGE] No auth state, redirecting to login');
    redirect('/login');
  }
  
  if (authState.onboardingCompleted === false) {
    console.log('[PROFILE_PAGE] Onboarding not completed, redirecting');
    redirect('/onboarding');
  }
  
  console.log('[PROFILE_PAGE] Loading dashboard data');
  const data = await loadDashboardData(rthConfig, authState);
  console.log('[PROFILE_PAGE] Rendering page');
  
  return (
    <ErrorBoundary>
      <DashboardProfilePage config={rthConfig} data={data} />
    </ErrorBoundary>
  );
}
