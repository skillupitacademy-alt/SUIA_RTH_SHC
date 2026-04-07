import ExamLaunchPage from '../../../../../src/share-branding/ExamLaunchPage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Mission Configuration | SkillUp',
  description: 'Launch targeted live certification exams across SkillUp Academy.',
};

export default function Page() {
  return <ExamLaunchPage config={skillUpConfig} />;
}
