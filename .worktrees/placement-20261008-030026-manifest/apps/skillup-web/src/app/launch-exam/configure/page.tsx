import { redirect } from 'next/navigation';
import { validateAuthState } from '../../../../../../src/share-branding/auth/validateAuthState';
import ExamLaunchConfigurationPage from '../../../../../../src/share-branding/ExamLaunchConfigurationPage';
import { skillUpConfig } from '../../../../../../src/share-branding/brandConfig';
import { loadLaunchExamData } from '../../../../../../src/share-branding/launchExamPageData';

export const metadata = {
  title: 'Mission Configuration | SkillUp',
  description: 'Configure your certification assessment on SkillUp IT Academy.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  // 🔐 AUTH PROTECTION: Require authentication
  const auth = await validateAuthState();
  
  if (!auth) {
    redirect('/login');
  }
  
  if (auth.onboardingCompleted === false) {
    redirect('/onboarding');
  }
  
  const data = await loadLaunchExamData(skillUpConfig);
  return <ExamLaunchConfigurationPage config={skillUpConfig} data={data} />;
}
