import AuthPage from '../../../../../src/share-branding/AuthPage';
import { loadAuthPageData } from '../../../../../src/share-branding/authPageData';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Login | SkillUp IT Academy',
  description: 'Sign in to the SkillUp IT Academy student portal.',
};

export default async function LoginPage() {
  const data = await loadAuthPageData(skillUpConfig);
  return <AuthPage config={skillUpConfig} data={data} initialMode="login" />;
}
