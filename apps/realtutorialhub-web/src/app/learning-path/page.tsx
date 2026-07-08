import { LearningPage } from '../../../../../src/share-branding/LearningExperience/LearningPage';
import { rthConfig } from '../../../../../src/share-branding/brandConfig';

export const metadata = {
  title: 'Python Lists — Part 1 | RealTutorialHub',
  description: 'Master Python lists: internal memory representation, indexing, nested lists, negative indexing, and slicing.',
  openGraph: {
    title: 'Python Lists — Part 1 | RealTutorialHub',
    description: 'Master Python lists: internal memory representation, indexing, nested lists, negative indexing, and slicing.',
  },
};

export default function Page() {
  return (
    <LearningPage
      brandColor={rthConfig.primaryColor}
      brandName={rthConfig.name}
    />
  );
}
