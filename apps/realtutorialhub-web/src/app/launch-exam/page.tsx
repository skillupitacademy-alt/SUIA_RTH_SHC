import ExamLaunchPage from '../../../../../src/share-branding/ExamLaunchPage';
import { loadLaunchExamData } from '../../../../../src/share-branding/launchExamPageData';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Exam Configuration | RealTutorialHub',
  description: 'Launch customized diagnostic assessments on RealTutorialHub.',
};

export default async function Page() {
  const data = await loadLaunchExamData(rthConfig);
  return <ExamLaunchPage config={rthConfig} data={data} />;
}
