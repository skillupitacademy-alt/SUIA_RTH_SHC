import BankingOnboardingSystemPage from '../../../../../../src/share-branding/BankingOnboardingSystemPage';
import { rthConfig } from '../../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Banking Onboarding Assignment | RealTutorialHub',
  description: 'Multi-Protocol International Banking Onboarding System assignment.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return <BankingOnboardingSystemPage config={rthConfig} />;
}
