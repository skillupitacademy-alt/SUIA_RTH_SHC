import AuthPage from '../../../../../src/share-branding/AuthPage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Login | RealTutorialHub',
  description: 'Sign in to the RealTutorialHub learner portal.',
};

export default function LoginPage() {
  return <AuthPage config={rthConfig} initialMode="login" />;
}
