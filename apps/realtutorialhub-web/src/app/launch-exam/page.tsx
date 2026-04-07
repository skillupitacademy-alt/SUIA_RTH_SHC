import ExamLaunchPage from '../../../../../src/share-branding/ExamLaunchPage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Exam Configuration | RealTutorialHub',
  description: 'Launch customized diagnostic assessments on RealTutorialHub.',
};

export default function Page() {
  return <ExamLaunchPage config={rthConfig} />;
}
