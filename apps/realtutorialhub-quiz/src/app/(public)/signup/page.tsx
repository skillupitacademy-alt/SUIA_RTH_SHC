import AuthPage from '../../../../../../src/share-branding/AuthPage';

export const metadata = {
  title: 'Sign Up | RealTutorialHub Quiz',
  description: 'Create your RealTutorialHub quiz account.',
};

export default function SignupPage() {
  return <AuthPage brand="realtutorialhub" initialMode="signup" />;
}
