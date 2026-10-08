import { redirect } from 'next/navigation';
import { validateAuthState } from '../../../../../src/share-branding/auth/validateAuthState';
import ExamLaunchPage from '../../../../../src/share-branding/ExamLaunchPage';
import { loadLaunchExamData } from '../../../../../src/share-branding/launchExamPageData';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Instruction Manual | RealTutorialHub',
  description: 'Review the exam engine instruction manual before configuring your assessment on RealTutorialHub.',
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
  return <ExamLaunchPage config={rthConfig} data={data} />;
}
