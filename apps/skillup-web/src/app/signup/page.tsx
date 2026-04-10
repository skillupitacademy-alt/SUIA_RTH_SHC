import AuthPage from '../../../../../src/share-branding/AuthPage';
import { loadAuthPageData } from '../../../../../src/share-branding/authPageData';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Sign Up | SkillUp IT Academy',
  description: 'Create your SkillUp IT Academy account and start learning.',
};

export default async function SignupPage() {
  const data = await loadAuthPageData(skillUpConfig);
  return <AuthPage config={skillUpConfig} data={data} initialMode="signup" />;
}
