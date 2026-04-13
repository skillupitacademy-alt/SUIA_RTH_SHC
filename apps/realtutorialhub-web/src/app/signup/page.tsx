import AuthPage from '../../../../../src/share-branding/AuthPage';

export const metadata = {
  title: 'Sign Up | RealTutorialHub',
  description: 'Create your RealTutorialHub account and start learning.',
};

export default function SignupPage() {
  return <AuthPage brand="realtutorialhub" initialMode="signup" />;
}
