'use client';

import React, { useState } from 'react';
import { BrandConfig } from '../brandConfig';
import { BrandProvider } from '../PostLandingPage/app/context/BrandContext';
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
      <main className="mt-20 px-4 pb-28 pt-8 transition-all sm:px-6 xl:ml-[260px] xl:px-8 xl:pb-8">
        <div className="mx-auto max-w-[1600px]">
          
          {/* Top Row: Welcome Hero */}
          <WelcomeHero />

          {/* Grid Layout matching the Image */}
          <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-12 mb-6 lg:mb-8">
            
            {/* Left Column (Progress & Assignments) */}
            <div className="flex flex-col gap-6 lg:gap-8 xl:col-span-4">
              <div className="h-[400px]">
                <LearningProgressOverview />
              </div>
              <div className="h-[380px]">
                <AssignmentsWidget />
              </div>
            </div>

            {/* Middle Column (Domains & Projects) */}
            <div className="flex flex-col gap-6 lg:gap-8 xl:col-span-5">
              <div className="h-[400px]">
                <MyDomainsGrid />
              </div>
              <div className="h-[380px]">
                <ProjectsWidget />
              </div>
            </div>

            {/* Right Column (Sync & Career) */}
            <div className="flex flex-col gap-6 lg:gap-8 xl:col-span-3">
              <div className="h-[400px]">
                <EngineSynchronizationWidget />
              </div>
              <div className="h-[380px]">
                <CareerReadinessWidget />
              </div>
            </div>

          </div>
          
          {/* Footer Help */}
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-6 py-3 text-sm font-semibold text-blue-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">ℹ</span>
            Tip: Use the Tutor regularly to clear doubts and reinforce your learning!
          </div>

        </div>
      </main>
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
