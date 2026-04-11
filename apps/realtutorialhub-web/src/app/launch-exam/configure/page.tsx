import ExamLaunchConfigurationPage from '../../../../../../src/share-branding/ExamLaunchConfigurationPage';
import { rthConfig } from '../../../../../../src/share-branding/brandConfig';
import { loadLaunchExamData } from '../../../../../../src/share-branding/launchExamPageData';

export const metadata = {
  title: 'Exam Configuration | RealTutorialHub',
  description: 'Configure your diagnostic assessment on RealTutorialHub.',
};

export default async function Page() {
  const data = await loadLaunchExamData(rthConfig);
  return <ExamLaunchConfigurationPage config={rthConfig} data={data} />;
}
