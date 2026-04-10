import DashboardPage from '../../../../../src/share-branding/DashboardPage';
import { loadDashboardData } from '../../../../../src/share-branding/dashboardPageData';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Dashboard | SkillUp IT Academy',
  description: 'Your SkillUp Engine Command Center.',
};

export default async function Page() {
  const data = await loadDashboardData(skillUpConfig);
  return <DashboardPage config={skillUpConfig} data={data} />;
}
