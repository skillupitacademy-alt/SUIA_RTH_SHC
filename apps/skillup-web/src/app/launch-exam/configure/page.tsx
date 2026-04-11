import ExamLaunchConfigurationPage from '../../../../../../src/share-branding/ExamLaunchConfigurationPage';
import { skillUpConfig } from '../../../../../../src/share-branding/brandConfig';
import { loadLaunchExamData } from '../../../../../../src/share-branding/launchExamPageData';

export const metadata = {
  title: 'Mission Configuration | SkillUp',
  description: 'Configure your certification assessment on SkillUp IT Academy.',
};

export default async function Page() {
  const data = await loadLaunchExamData(skillUpConfig);
  return <ExamLaunchConfigurationPage config={skillUpConfig} data={data} />;
}
