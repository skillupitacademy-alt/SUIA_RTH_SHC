import type { Metadata } from 'next';

import SkillUpLanding from '../../../../src/share-branding/SkillUpLanding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'SkillUp IT Academy - Skill Up. Stand Out.',
    description: 'Industry-ready IT training powered by expert mentors and hands-on practice.',
    openGraph: {
      title: 'SkillUp IT Academy - Skill Up. Stand Out.',
      description: 'Industry-ready IT training powered by expert mentors and hands-on practice.',
    },
  };
}

export default function HomePage() {
  return <SkillUpLanding />;
}
