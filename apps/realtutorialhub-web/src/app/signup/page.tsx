import AuthPage from '../../../../../src/share-branding/AuthPage';
import { loadAuthPageData } from '../../../../../src/share-branding/authPageData';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Sign Up | RealTutorialHub',
  description: 'Create your RealTutorialHub account and start learning.',
};

export default async function SignupPage() {
  const data = await loadAuthPageData(rthConfig);
  return <AuthPage config={rthConfig} data={data} initialMode="signup" />;
}
