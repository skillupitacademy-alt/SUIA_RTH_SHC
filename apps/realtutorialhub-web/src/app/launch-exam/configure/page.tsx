import { redirect } from 'next/navigation';
import { validateAuthState } from '../../../../../../src/share-branding/auth/validateAuthState';
import ExamLaunchConfigurationPage from '../../../../../../src/share-branding/ExamLaunchConfigurationPage';
import { rthConfig } from '../../../../../../src/share-branding/brandConfig';
import { loadLaunchExamData } from '../../../../../../src/share-branding/launchExamPageData';

export const metadata = {
  title: 'Exam Configuration | RealTutorialHub',
  description: 'Configure your diagnostic assessment on RealTutorialHub.',
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
  
  const data = await loadLaunchExamData(rthConfig);
  return <ExamLaunchConfigurationPage config={rthConfig} data={data} />;
}
