"use client";

import { BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { brands } from '@/share-branding/PostLandingPage/app/config/brands';
import { Navigation } from '@/share-branding/PostLandingPage/app/components/Navigation';
import { HeroSection } from '@/share-branding/PostLandingPage/app/components/HeroSection';
import { ProblemStatement } from '@/share-branding/PostLandingPage/app/components/ProblemStatement';
import { SolutionSection } from '@/share-branding/PostLandingPage/app/components/SolutionSection';
import { AdaptiveLoop } from '@/share-branding/PostLandingPage/app/components/AdaptiveLoop';
import { AITutorSection } from '@/share-branding/PostLandingPage/app/components/AITutorSection';
import { AssignmentSystem } from '@/share-branding/PostLandingPage/app/components/AssignmentSystem';
import { RealProjects } from '@/share-branding/PostLandingPage/app/components/RealProjects';
import { SmartRemediation } from '@/share-branding/PostLandingPage/app/components/SmartRemediation';
import { ComparisonTable } from '@/share-branding/PostLandingPage/app/components/ComparisonTable';
import { PricingSection } from '@/share-branding/PostLandingPage/app/components/PricingSection';
import { FinalCTA } from '@/share-branding/PostLandingPage/app/components/FinalCTA';

interface LandingPageProps {
  brand: 'rth' | 'skillup';
}

export function LandingPage({ brand }: LandingPageProps) {
  const brandConfig = brands[brand];

  return (
    <BrandProvider brand={brandConfig}>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white">
        <Navigation />
        <main>
          <HeroSection />
          <ProblemStatement />
          <SolutionSection />
          <AdaptiveLoop />
          <AITutorSection />
          <AssignmentSystem />
          <RealProjects />
          <SmartRemediation />
          <ComparisonTable />
          <PricingSection />
        </main>
        <FinalCTA />
      </div>
    </BrandProvider>
  );
}
