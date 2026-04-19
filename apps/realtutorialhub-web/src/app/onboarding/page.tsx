import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { fetchBackendAuthState } from '../../../../../src/share-branding/auth/serverAuthState';
import { OnboardingPage } from '../../../../../src/share-branding/OnboardingEngine/components/OnboardingPage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';
import { loadOnboardingData } from '../../../../../src/share-branding/onboardingPageData';

export const metadata = {
  title: 'Onboarding | RealTutorialHub',
  description: 'Set up your learning profile.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RTHOnboardingRoute() {
  const authState = await fetchBackendAuthState();
  if (authState && authState.onboardingCompleted === true) {
    redirect('/dashboard');
  }
  const data = await loadOnboardingData(rthConfig);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingPage config={rthConfig} data={data} />
    </Suspense>
  );
}
