"use client";

import { BrandProvider } from '../context/BrandContext';
import { brands } from '../config/brands';
import { Navigation } from '../components/Navigation';
import { HeroSection } from '../components/HeroSection';
import { ProblemStatement } from '../components/ProblemStatement';
import { SolutionSection } from '../components/SolutionSection';
import { AdaptiveLoop } from '../components/AdaptiveLoop';
import { AITutorSection } from '../components/AITutorSection';
import { AssignmentSystem } from '../components/AssignmentSystem';
import { RealProjects } from '../components/RealProjects';
import { SmartRemediation } from '../components/SmartRemediation';
import { ComparisonTable } from '../components/ComparisonTable';
import { PricingSection } from '../components/PricingSection';
import { FinalCTA } from '../components/FinalCTA';

interface LandingPageProps {
  brand: 'rth' | 'skillup';
}

export function LandingPage({ brand }: LandingPageProps) {
  const brandConfig = brands[brand];

  return (
    <BrandProvider brand={brandConfig}>
      <div className="min-h-screen bg-white overflow-x-hidden">
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
