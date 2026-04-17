import { redirect } from 'next/navigation';

import { fetchBackendAuthState } from '../../../../../../src/share-branding/auth/serverAuthState';
import DashboardProfilePage from '../../../../../../src/share-branding/DashboardProfilePage';
import { loadDashboardData } from '../../../../../../src/share-branding/dashboardPageData';
import { rthConfig } from '../../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Profile | RealTutorialHub',
  description: 'Manage your RealTutorialHub profile and learning preferences.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const authState = await fetchBackendAuthState();
  
  if (!authState) {
    redirect('/login');
  }
  
  if (authState.onboardingCompleted === false) {
    redirect('/onboarding');
  }
  
  const data = await loadDashboardData(rthConfig);
  return <DashboardProfilePage config={rthConfig} data={data} />;
}
