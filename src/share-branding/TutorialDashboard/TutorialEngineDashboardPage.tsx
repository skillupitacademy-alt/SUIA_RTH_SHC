'use client';

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { BrandConfig } from '../brandConfig';
import { BrandProvider, useBrand } from '../PostLandingPage/app/context/BrandContext';
import { AuthRefreshProvider } from '../auth/AuthRefreshProvider';
import { TutorialDashboardViewData } from '../tutorialDashboardData';
import { TutorialDashboardDataProvider } from './components/TutorialDashboardDataContext';

import { TutorialSidebar } from './components/TutorialSidebar';
import { TutorialTopBar } from './components/TutorialTopBar';
import { WelcomeHero } from './components/WelcomeHero';
import { LearningProgressOverview } from './components/LearningProgressOverview';
import { MyDomainsGrid } from './components/MyDomainsGrid';
import { EngineSynchronizationWidget } from './components/EngineSynchronizationWidget';
import { AssignmentsWidget } from './components/AssignmentsWidget';
import { ProjectsWidget } from './components/ProjectsWidget';
import { CareerReadinessWidget } from './components/CareerReadinessWidget';

function TutorialDashboardContent() {
  const brand = useBrand();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#f8fafc] font-sans selection:bg-orange-500/30">

      <TutorialSidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      <TutorialTopBar
        onOpenSidebar={() => setIsMobileNavOpen(true)}
      />

      {/* Main Content Area */}
      <main className="mt-20 px-4 pb-28 pt-8 transition-all sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto max-w-[1600px]">

          {/* Top Row: Welcome Hero (Already 3 columns internally) */}
          <WelcomeHero />

          {/* Master Grid Layout (using base-6 for maximum flexibility) */}
          <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-6 mb-6 lg:mb-8">

            {/* My Domains: Full Width (6/6) */}
            <div className="lg:col-span-6">
              <MyDomainsGrid />
            </div>

            {/* Row: Assignments + Projects + Career Readiness (each 2/6 = 1/3) */}
            <div className="lg:col-span-2">
              <AssignmentsWidget />
            </div>
            <div className="lg:col-span-2">
              <ProjectsWidget />
            </div>
            <div className="lg:col-span-2">
              <CareerReadinessWidget />
            </div>

            {/* Row: Learning Progress + Engine Synchronization (each 3/6 = 1/2) */}
            <div className="lg:col-span-3">
              <LearningProgressOverview />
            </div>
            <div className="lg:col-span-3">
              <EngineSynchronizationWidget />
            </div>

          </div>

          {/* Footer Help */}
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-6 py-3 text-sm font-semibold text-blue-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">ℹ</span>
            Tip: Use the Tutor regularly to clear doubts and reinforce your learning!
          </div>

        </div>
      </main>

      {/* Floating Action Button (Support / AI Chat) */}
      <button
        aria-label={`Open ${brand.tutorLabel} Support`}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all hover:scale-110 active:scale-95 group"
        style={{ backgroundColor: brand.primaryColor }}
      >
        <MessageCircle size={24} className="transition-transform group-hover:rotate-12" />
        
        {/* Pulsing notification dot */}
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-white border-2" style={{ borderColor: brand.primaryColor }}></span>
        </span>

        {/* Support Label on hover */}
        <div className="absolute right-full mr-4 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white group-hover:block shadow-xl">
          Need help? Chat with {brand.tutorLabel}
        </div>
      </button>
    </div>
  );
}

export default function TutorialEngineDashboardPage({
  config,
  data
}: {
  config: BrandConfig;
  data: TutorialDashboardViewData
}) {
  return (
    <BrandProvider brand={config}>
      <AuthRefreshProvider>
        <TutorialDashboardDataProvider value={data}>
          <TutorialDashboardContent />
        </TutorialDashboardDataProvider>
      </AuthRefreshProvider>
    </BrandProvider>
  );
}
