import React from 'react';
import { Menu, Bell, Flame, Star, Award, ChevronDown, Settings } from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';

export function TutorialTopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const brand = useBrand();
  const { header } = useTutorialDashboardData();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-20 items-center justify-between border-b border-gray-100 bg-white px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100"
          aria-label="Open Sidebar"
        >
          <Menu size={24} />
        </button>
        <div className="hidden flex-col md:flex">
          <h1 className="text-xl font-black text-gray-900">{header.title}</h1>
          <p className="text-xs font-semibold text-gray-600">{header.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Gamification Stats */}
        <div className="hidden items-center gap-6 rounded-2xl bg-white px-6 py-2 shadow-md border border-gray-100 lg:flex">
          {/* Streak */}
          <div className="flex items-center gap-3 border-r border-gray-200 pr-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
              <Flame className="text-orange-700" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black leading-none text-gray-900">{header.streakCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">{header.streakLabel}</span>
            </div>
          </div>

          {/* XP Points */}
          <div className="flex items-center gap-3 border-r border-gray-200 pr-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
              <Star className="text-yellow-700" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black leading-none text-gray-900">{header.xpPoints}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">XP Points</span>
            </div>
          </div>

          {/* Level */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
              <Award className="text-purple-700" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black leading-none text-gray-900">Level {header.level}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">{header.levelRole}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Settings size={18} />
          </button>
          
          <button 
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
          </button>
          
          <button 
            aria-label={`User Menu for ${header.userName}`}
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>
              {header.userInitials}
            </div>
            <div className="hidden flex-col items-start sm:flex">
              <span className="text-sm font-bold text-gray-900">{header.userName}</span>
              <span className="text-[10px] font-semibold text-gray-600">{header.userRole}</span>
            </div>
            <ChevronDown size={16} className="text-gray-500 hidden sm:block" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
