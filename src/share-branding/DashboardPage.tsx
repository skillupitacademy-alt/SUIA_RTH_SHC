'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { BrandConfig } from './brandConfig';
import { BrandProvider } from './PostLandingPage/app/context/BrandContext';
import { AuthRefreshProvider } from './auth/AuthRefreshProvider';
import { Sidebar } from './Dashboard/components/Sidebar';
import { TopBar } from './Dashboard/components/TopBar';
import { HeroActionCard } from './Dashboard/components/HeroActionCard';
import { EngineSynopsisWidget } from './Dashboard/components/EngineSynopsisWidget';
import { ActivityLog } from './Dashboard/components/ActivityLog';
import { CompetencyRadarChart } from './Dashboard/components/CompetencyRadarChart';
import { CapstoneUnlockWidget } from './Dashboard/components/CapstoneUnlockWidget';
import { DailyProgressWidget } from './Dashboard/components/DailyProgressWidget';
import { AITutorSuggestions } from './Dashboard/components/AITutorSuggestions';
import { EngineSynchronization } from './Dashboard/components/EngineSynchronization';
import { DashboardDataProvider, useDashboardData } from './Dashboard/components/DashboardDataContext';
import { DashboardViewData } from './dashboardPageData';

function DashboardContent() {
  const { header } = useDashboardData();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      <TopBar
        mobileMenuButton={(
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open dashboard navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      />

      <main className="mt-20 px-4 pb-28 pt-6 transition-all sm:px-6 md:ml-20 md:px-8 md:pb-8 lg:px-12">
        <div className="mx-auto max-w-[1800px]">
          <div className="mb-8 md:mb-10">
            <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {header.title}
            </h1>
            <p className="max-w-3xl text-base font-bold text-slate-500 sm:text-lg lg:text-xl">
              {header.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-5">
            <div className="space-y-6 lg:space-y-8 xl:col-span-3">
              <HeroActionCard />
              <EngineSynchronization />
              <EngineSynopsisWidget />
              <ActivityLog />
            </div>

            <div className="space-y-6 lg:space-y-8 xl:col-span-2">
              <DailyProgressWidget />
              <AITutorSuggestions />
              <CompetencyRadarChart />
              <CapstoneUnlockWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage({ config, data }: { config: BrandConfig; data: DashboardViewData }) {
  return (
    <BrandProvider brand={config}>
      <AuthRefreshProvider>
        <DashboardDataProvider value={data}>
          <DashboardContent />
        </DashboardDataProvider>
      </AuthRefreshProvider>
    </BrandProvider>
  );
}
