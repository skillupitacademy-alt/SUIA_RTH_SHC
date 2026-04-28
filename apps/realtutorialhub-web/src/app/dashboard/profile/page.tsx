import { redirect } from 'next/navigation';

import { fetchBackendAuthState } from '../../../../../../src/share-branding/auth/serverAuthState';
import { validateAuthState } from '../../../../../../src/share-branding/auth/validateAuthState';
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

  // Validate auth state
  const auth = await validateAuthState();
  
  if (!auth) {
    console.log('[PROFILE_PAGE] No auth, redirecting to login');
    redirect('/login');
  }

  if (auth.onboardingCompleted === false) {
    console.log('[PROFILE_PAGE] Onboarding not completed, redirecting');
    redirect('/onboarding');
  }

  // Fetch full profile data with fallback
  let authState;
  try {
    authState = await fetchBackendAuthState();
    console.log('[PROFILE_PAGE] Full auth state fetched:', {
      hasAuthState: !!authState,
      userId: authState?.id,
      email: authState?.email,
    });
  } catch (error) {
    console.warn('[PROFILE_PAGE] Failed to fetch full auth state, using validated auth:', error);
    authState = auth;
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
