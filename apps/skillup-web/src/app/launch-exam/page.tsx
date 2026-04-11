import ExamLaunchPage from '../../../../../src/share-branding/ExamLaunchPage';
import { loadLaunchExamData } from '../../../../../src/share-branding/launchExamPageData';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Instruction Manual | SkillUp',
  description: 'Review the exam engine instruction manual before configuring your assessment on SkillUp IT Academy.',
};

export default async function Page() {
  const data = await loadLaunchExamData(skillUpConfig);
  return <ExamLaunchPage config={skillUpConfig} data={data} />;
}
