import DashboardPage from '../../../../../src/share-branding/DashboardPage';
import { loadDashboardData } from '../../../../../src/share-branding/dashboardPageData';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Dashboard | RealTutorialHub',
  description: 'Your RealTutorialHub Engine Command Center.',
};

export default async function Page() {
  const data = await loadDashboardData(rthConfig);
  return <DashboardPage config={rthConfig} data={data} />;
}
