import { Suspense } from 'react';
import AuthPage from '../../../../../src/share-branding/AuthPage';

export const metadata = {
  title: 'Login | RealTutorialHub',
  description: 'Sign in to the RealTutorialHub learner portal.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPage brand="realtutorialhub" initialMode="login" />
    </Suspense>
  );
}
