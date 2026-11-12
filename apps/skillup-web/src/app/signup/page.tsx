import AuthPage from '../../../../../src/share-branding/AuthPage';

export const metadata = {
  title: 'Sign Up | SkillUp IT Academy',
  description: 'Create your SkillUp IT Academy account and start learning.',
};

export default function SignupPage() {
  return <AuthPage brand="skillup" initialMode="signup" />;
}
