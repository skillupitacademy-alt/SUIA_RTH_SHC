'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { BrandConfig } from './brandConfig';
import { BrandProvider } from './PostLandingPage/app/context/BrandContext';
import { Sidebar } from './Dashboard/components/Sidebar';
import { TopBar } from './Dashboard/components/TopBar';
import { ProfileScreen } from './screens/user/ProfileScreen';
import { DashboardDataProvider, useDashboardData } from './Dashboard/components/DashboardDataContext';
import { DashboardViewData } from './dashboardPageData';

function DashboardProfileContent() {
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
        <div className="mx-auto max-w-[1400px]">
          <ProfileScreen />
        </div>
      </main>
    </div>
  );
}

export default function DashboardProfilePage({ config, data }: { config: BrandConfig; data: DashboardViewData }) {
  return (
    <BrandProvider brand={config}>
      <DashboardDataProvider value={data}>
        <DashboardProfileContent />
      </DashboardDataProvider>
    </BrandProvider>
  );
}
