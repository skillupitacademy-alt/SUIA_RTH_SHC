import AuthPage from '../../../../../src/share-branding/AuthPage';

export const metadata = {
  title: 'Login | RealTutorialHub',
  description: 'Sign in to the RealTutorialHub learner portal.',
};

export default function LoginPage() {
  return <AuthPage brand="realtutorialhub" initialMode="login" />;
}
