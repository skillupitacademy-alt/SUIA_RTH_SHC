import PythonNotesPage from '../../../../../src/share-branding/PythonNotes/PythonNotesPage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Learning Path | RealTutorialHub',
  description: 'Your personalized Python learning path.',
};

export default async function Page() {
  return <PythonNotesPage config={rthConfig} />;
}
