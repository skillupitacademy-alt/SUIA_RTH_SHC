import { OnboardingPage } from '../../../../../src/share-branding/OnboardingEngine/components/OnboardingPage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';
import { loadOnboardingData } from '../../../../../src/share-branding/onboardingPageData';

export const metadata = {
  title: 'Onboarding | RealTutorialHub',
  description: 'Set up your learning profile.',
};

export default async function RTHOnboardingRoute() {
  const data = await loadOnboardingData(rthConfig);
  return <OnboardingPage config={rthConfig} data={data} />;
}
