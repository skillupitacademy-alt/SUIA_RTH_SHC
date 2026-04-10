import React from 'react';
import { Search, Flame, ChevronDown } from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useDashboardData } from './DashboardDataContext';

export function TopBar({ mobileMenuButton }: { mobileMenuButton?: React.ReactNode }) {
  const brand = useBrand();
  const { header } = useDashboardData();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-20 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:gap-4 sm:px-6 md:left-20 md:gap-6 md:px-8">
      {mobileMenuButton}

      <div className="relative hidden max-w-xl min-w-0 flex-1 sm:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={header.searchPlaceholder}
          className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': brand.primaryColor } as React.CSSProperties}
        />
      </div>

      <div className="hidden h-12 shrink-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm xs:flex sm:px-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <Flame className="text-white" size={18} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs leading-none text-gray-500">{header.streakLabel}</span>
          <span className="mt-0.5 text-lg font-black leading-none" style={{ color: brand.primaryColor }}>
            {header.streakCount}
          </span>
        </div>
      </div>

      <button className="ml-auto flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 transition-all hover:border-gray-300 sm:ml-0 sm:gap-3 sm:px-4">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {header.userInitials}
        </div>
        <div className="hidden min-[420px]:flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900">{header.userName}</span>
          <span className="text-xs text-gray-500">{header.userRole}</span>
        </div>
        <ChevronDown className="text-gray-400" size={18} />
      </button>
    </header>
  );
}
