import DashboardPage from '../../../../../src/share-branding/DashboardPage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Dashboard | RealTutorialHub',
  description: 'Your RealTutorialHub Engine Command Center.',
};

export default function Page() {
  return <DashboardPage config={rthConfig} />;
}
