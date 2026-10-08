import TutorialEngineDashboardPage from '../../../../../src/share-branding/TutorialDashboard/TutorialEngineDashboardPage';
import { buildTutorialDashboardData } from '../../../../../src/share-branding/tutorialDashboardData';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Tutorial Engine Dashboard | RealTutorialHub',
  description: 'Your personalized learning command center.',
};

export default async function Page() {
  const data = buildTutorialDashboardData(rthConfig);
  return <TutorialEngineDashboardPage config={rthConfig} data={data} />;
}
