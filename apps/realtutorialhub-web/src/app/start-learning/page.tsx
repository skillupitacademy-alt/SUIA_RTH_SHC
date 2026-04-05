import { rthConfig } from '../../../../../src/share-branding/brandConfig';
import StartLearningGateway from '../../../../../src/share-branding/StartLearningGateway';

export const metadata = {
  title: 'Start Learning - RealTutorialHub',
  description: 'Choose between the exam engine and tutorial engine for RealTutorialHub.',
};

export default function RealTutorialHubStartLearningPage() {
  return <StartLearningGateway config={rthConfig} />;
}
