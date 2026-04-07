import AuthPage from '../../../../../src/share-branding/AuthPage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Login | SkillUp IT Academy',
  description: 'Sign in to the SkillUp IT Academy student portal.',
};

export default function LoginPage() {
  return <AuthPage config={skillUpConfig} initialMode="login" />;
}
