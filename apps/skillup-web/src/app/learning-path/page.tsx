import { LearningPage } from '../../../../../src/share-branding/LearningExperience/LearningPage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Python Lists — Part 1 | SkillUp IT Academy',
  description: 'Master Python lists: internal memory representation, indexing, nested lists, negative indexing, and slicing.',
  openGraph: {
    title: 'Python Lists — Part 1 | SkillUp IT Academy',
    description: 'Master Python lists: internal memory representation, indexing, nested lists, negative indexing, and slicing.',
  },
};

export default function Page() {
  return (
    <LearningPage
      brandColor={skillUpConfig.primaryColor}
      brandName={skillUpConfig.name}
    />
  );
}
