import DashboardPage from '../../../../../src/share-branding/DashboardPage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Dashboard | SkillUp IT Academy',
  description: 'Your SkillUp Engine Command Center.',
};

export default function Page() {
  return <DashboardPage config={skillUpConfig} />;
}
