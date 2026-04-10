import AuthPage from '../../../../../src/share-branding/AuthPage';
import { loadAuthPageData } from '../../../../../src/share-branding/authPageData';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Login | RealTutorialHub',
  description: 'Sign in to the RealTutorialHub learner portal.',
};

export default async function LoginPage() {
  const data = await loadAuthPageData(rthConfig);
  return <AuthPage config={rthConfig} data={data} initialMode="login" />;
}
