import TutorialEnginePage from '../../../../../src/share-branding/TutorialEnginePage';
import { loadTutorialData } from '../../../../../src/share-branding/tutorialPageData';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Tutorial Engine | RealTutorialHub',
  description: 'Immersive guided learning paths for technical mastery.',
};

export default async function Page() {
  const data = await loadTutorialData(rthConfig);
  return <TutorialEnginePage config={rthConfig} data={data} />;
}
