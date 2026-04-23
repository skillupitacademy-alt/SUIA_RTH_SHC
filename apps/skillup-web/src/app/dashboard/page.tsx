import { redirect } from 'next/navigation';

import { fetchBackendAuthState } from '../../../../../src/share-branding/auth/serverAuthState';
import DashboardPage from '../../../../../src/share-branding/DashboardPage';
import { loadDashboardData } from '../../../../../src/share-branding/dashboardPageData';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Dashboard | SkillUp IT Academy',
  description: 'Your SkillUp Engine Command Center.',
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
    const data = await loadDashboardData(skillUpConfig, authState);
    return <DashboardPage config={skillUpConfig} data={data} />;
  } catch (error) {
    console.error('[SKILLUP_DASHBOARD] Error loading dashboard data:', error);
    // If dashboard data loading fails, redirect to login
    redirect('/login');
  }
}
