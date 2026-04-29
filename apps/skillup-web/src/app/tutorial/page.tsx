import TutorialEngineDashboardPage from '../../../../../src/share-branding/TutorialDashboard/TutorialEngineDashboardPage';
import { buildTutorialDashboardData } from '../../../../../src/share-branding/tutorialDashboardData';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Mentorship Dashboard | SkillUp Academy',
  description: 'Your personalized learning and mentorship command center.',
};

export default async function Page() {
  const data = buildTutorialDashboardData(skillUpConfig);
  return <TutorialEngineDashboardPage config={skillUpConfig} data={data} />;
}
