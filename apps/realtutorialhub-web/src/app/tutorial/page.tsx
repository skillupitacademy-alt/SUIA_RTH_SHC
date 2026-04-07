import TutorialEnginePage from '../../../../../src/share-branding/TutorialEnginePage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Tutorial Engine | RealTutorialHub',
  description: 'Immersive guided learning paths for technical mastery.',
};

export default function Page() {
  return <TutorialEnginePage config={rthConfig} />;
}
