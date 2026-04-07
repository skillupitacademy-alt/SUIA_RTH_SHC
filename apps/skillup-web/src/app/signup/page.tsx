import AuthPage from '../../../../../src/share-branding/AuthPage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Sign Up | SkillUp IT Academy',
  description: 'Create your SkillUp IT Academy account and start learning.',
};

export default function SignupPage() {
  return <AuthPage config={skillUpConfig} initialMode="signup" />;
}
