import type { Metadata } from 'next';

import RTHLanding from '../../../../src/share-branding/RTHLanding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'RealTutorialHub - Learn Smarter. Not Harder.',
    description: 'The most advanced structured learning engine designed for modern developers and tech professionals.',
    openGraph: {
      title: 'RealTutorialHub - Learn Smarter. Not Harder.',
      description: 'The most advanced structured learning engine designed for modern developers and tech professionals.',
    },
  };
}

export default function HomePage() {
  return <RTHLanding />;
}
