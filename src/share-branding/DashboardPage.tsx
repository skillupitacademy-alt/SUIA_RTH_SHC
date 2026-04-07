'use client';

import React from 'react';
import { BrandConfig } from './brandConfig';
import { BrandProvider, useBrand } from './PostLandingPage/app/context/BrandContext';
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

function DashboardContent() {
  const brand = useBrand();

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      <Sidebar />
      <TopBar />

      {/* Main Content Area */}
      {/* ml-20 accounts for typical mini-sidebar width, adjust if main sidebar differs (e.g., md:ml-64) */}
      <main className="ml-20 mt-20 p-8 lg:p-12 transition-all">
        <div className="max-w-[1800px] mx-auto">
          {/* Welcome Header */}
          <div className="mb-10">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-2 tracking-tight">
              {brand.dashboardGreeting}
            </h1>
            <p className="text-xl font-bold text-slate-500">
              {brand.name} — Premium developer learning platform
            </p>
          </div>

          {/* Bento Grid Layout - 60/40 Split */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Left Column - 60% (3 columns on xl) */}
            <div className="xl:col-span-3 space-y-8">
              <HeroActionCard />
              <EngineSynchronization />
              <EngineSynopsisWidget />
              <ActivityLog />
            </div>

            {/* Right Column - 40% (2 columns on xl) */}
            <div className="xl:col-span-2 space-y-8">
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

export default function DashboardPage({ config }: { config: BrandConfig }) {
  // Uses Pattern B (Context wrapping) so deeply nested component files don't need prop drilling
  return (
    <BrandProvider brand={config}>
      <DashboardContent />
    </BrandProvider>
  );
}
