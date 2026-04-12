import { OnboardingPage } from '../../../../../src/share-branding/OnboardingEngine/components/OnboardingPage';

export const metadata = {
  title: 'Onboarding | RealTutorialHub',
  description: 'Set up your learning profile.',
};

export default function RTHOnboardingRoute() {
  return <OnboardingPage brand="rth" />;
}
