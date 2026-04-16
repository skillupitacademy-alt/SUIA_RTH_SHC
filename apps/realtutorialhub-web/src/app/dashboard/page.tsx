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
  if (authState && authState.onboardingCompleted === false) {
    redirect('/onboarding');
  }
  const data = await loadDashboardData(rthConfig);
  return <DashboardPage config={rthConfig} data={data} />;
}
