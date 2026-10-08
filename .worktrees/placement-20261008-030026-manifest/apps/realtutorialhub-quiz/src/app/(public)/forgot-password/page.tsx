import AuthPage from '../../../../../../src/share-branding/AuthPage';

export const metadata = {
  title: 'Forgot Password | RealTutorialHub Quiz',
  description: 'Recover access to your RealTutorialHub quiz account.',
};

export default function ForgotPasswordPage() {
  return <AuthPage brand="realtutorialhub" initialMode="forgot_password" />;
}
