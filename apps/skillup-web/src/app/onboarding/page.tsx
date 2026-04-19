import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { fetchBackendAuthState } from '../../../../../src/share-branding/auth/serverAuthState';
import { OnboardingPage } from '../../../../../src/share-branding/OnboardingEngine/components/OnboardingPage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';
import { loadOnboardingData } from '../../../../../src/share-branding/onboardingPageData';

export const metadata = {
  title: 'Onboarding | SkillUp IT Academy',
  description: 'Set up your mentorship profile.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SkillUpOnboardingRoute() {
  const authState = await fetchBackendAuthState();
  
  // If user is not authenticated, redirect to login
  if (!authState) {
    redirect('/login?redirect=/onboarding');
  }
  
  if (authState.onboardingCompleted === true) {
    redirect('/dashboard');
  }
  
  const data = await loadOnboardingData(skillUpConfig);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingPage config={skillUpConfig} data={data} />
    </Suspense>
  );
}
