import ExamLaunchPage from '../../../../../src/share-branding/ExamLaunchPage';
import { loadLaunchExamData } from '../../../../../src/share-branding/launchExamPageData';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Mission Configuration | SkillUp',
  description: 'Launch targeted live certification exams across SkillUp Academy.',
};

export default async function Page() {
  const data = await loadLaunchExamData(skillUpConfig);
  return <ExamLaunchPage config={skillUpConfig} data={data} />;
}
