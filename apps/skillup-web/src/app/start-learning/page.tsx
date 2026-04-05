import { skillupBrand } from '@quiz/config/src/brands';

import { StartLearningPage } from '../../../../../src/share-branding/StartLearningPage';

export const metadata = {
  title: 'Start Learning',
  description: 'Choose between the exam engine and tutorial engine for SkillUp IT Academy.',
};

export default function SkillUpStartLearningPage() {
  return <StartLearningPage brand={skillupBrand} backHref="/" />;
}
