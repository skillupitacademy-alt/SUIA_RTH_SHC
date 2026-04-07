import AuthPage from '../../../../../src/share-branding/AuthPage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Sign Up | RealTutorialHub',
  description: 'Create your RealTutorialHub account and start learning.',
};

export default function SignupPage() {
  return <AuthPage config={rthConfig} initialMode="signup" />;
}
