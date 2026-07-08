import PythonNotesPage from '../../../../../src/share-branding/PythonNotes/PythonNotesPage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Learning Path | SkillUp IT Academy',
  description: 'Your personalized Python learning path.',
};

export default async function Page() {
  return <PythonNotesPage config={skillUpConfig} />;
}
