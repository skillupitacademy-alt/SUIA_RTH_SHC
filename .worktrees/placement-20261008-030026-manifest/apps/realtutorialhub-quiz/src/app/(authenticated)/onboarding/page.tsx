import { redirect } from 'next/navigation';

import { fetchBackendAuthState } from '../../../../../../src/share-branding/auth/serverAuthState';
import { OnboardingPage } from '../../../../../../src/share-branding/OnboardingEngine/components/OnboardingPage';
import { loadOnboardingData } from '../../../../../../src/share-branding/onboardingPageData';
import { rthConfig } from '../../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Onboarding | RealTutorialHub Quiz',
  description: 'Set up your RealTutorialHub quiz profile.',
};

export default async function RealTutorialHubQuizOnboardingPage() {
  const authState = await fetchBackendAuthState();
  if (authState !== null && authState.onboardingCompleted === true) {
    redirect('/dashboard');
  }

  const data = await loadOnboardingData(rthConfig);
  return <OnboardingPage config={rthConfig} data={data} />;
}
