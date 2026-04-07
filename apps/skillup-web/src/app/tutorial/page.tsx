import TutorialEnginePage from '../../../../../src/share-branding/TutorialEnginePage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Live Mentorship | SkillUp Academy',
  description: 'Interactive curriculum validation and mentorship.',
};

export default function Page() {
  return <TutorialEnginePage config={skillUpConfig} />;
}
