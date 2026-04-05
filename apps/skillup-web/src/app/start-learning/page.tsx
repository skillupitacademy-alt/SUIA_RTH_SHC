import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';
import StartLearningGateway from '../../../../../src/share-branding/StartLearningGateway';

export const metadata = {
  title: 'Start Learning - SkillUp IT Academy',
  description: 'Choose between the exam engine and tutorial engine for SkillUp IT Academy.',
};

export default function SkillUpStartLearningPage() {
  return <StartLearningGateway config={skillUpConfig} />;
}
