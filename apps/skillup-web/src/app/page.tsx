import type { Metadata } from 'next';

import { skillupBrand } from '@quiz/config/src/brands';

import { SharedLandingPage } from '../../../../src/share-branding/SharedLandingPage';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'SkillUp IT Academy - Home',
    description: 'Brand-aware student landing page for SkillUp IT Academy.',
    openGraph: {
      title: 'SkillUp IT Academy - Home',
      description: 'Brand-aware student landing page for SkillUp IT Academy.',
    },
  };
}

export default function HomePage() {
  return (
    <SharedLandingPage
      brand={skillupBrand}
      startLearningHref="/start-learning"
      loginHref="/login"
    />
  );
}
