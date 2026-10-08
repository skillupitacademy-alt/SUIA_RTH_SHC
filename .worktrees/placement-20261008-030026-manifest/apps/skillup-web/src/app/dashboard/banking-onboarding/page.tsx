import BankingOnboardingSystemPage from '../../../../../../src/share-branding/BankingOnboardingSystemPage';
import { skillUpConfig } from '../../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Banking Onboarding Assignment | SkillUp IT Academy',
  description: 'Multi-Protocol International Banking Onboarding System assignment.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return <BankingOnboardingSystemPage config={skillUpConfig} />;
}
