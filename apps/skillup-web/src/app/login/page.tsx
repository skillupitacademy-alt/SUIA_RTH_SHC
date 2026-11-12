import AuthPage from '../../../../../src/share-branding/AuthPage';

export const metadata = {
  title: 'Login | SkillUp IT Academy',
  description: 'Sign in to the SkillUp IT Academy student portal.',
};

export default function LoginPage() {
  return <AuthPage brand="skillup" initialMode="login" />;
}
