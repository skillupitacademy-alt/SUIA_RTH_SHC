import TutorialEnginePage from '../../../../../src/share-branding/TutorialEnginePage';
import { loadTutorialData } from '../../../../../src/share-branding/tutorialPageData';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Live Mentorship | SkillUp Academy',
  description: 'Interactive curriculum validation and mentorship.',
};

export default async function Page() {
  const data = await loadTutorialData(skillUpConfig);
  return <TutorialEnginePage config={skillUpConfig} data={data} />;
}
