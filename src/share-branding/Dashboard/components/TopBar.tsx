import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Search, Flame, ChevronDown } from 'lucide-react';

export function TopBar() {
  const brand = useBrand();

  return (
    <header className="fixed top-0 left-20 right-0 h-20 bg-white border-b border-gray-200 flex items-center px-8 gap-6 z-40">
      {/* Universal Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search courses, topics, or mentors..."
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white transition-all"
          style={{ '--tw-ring-color': brand.primaryColor } as React.CSSProperties}
        />
      </div>

      {/* Day Streak Counter */}
      <div className="flex items-center gap-3 px-5 h-12 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <Flame className="text-white" size={18} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 leading-none">Streak</span>
          <span className="text-lg font-black leading-none mt-0.5" style={{ color: brand.primaryColor }}>
            14
          </span>
        </div>
      </div>

      {/* User Avatar Dropdown */}
      <button className="flex items-center gap-3 px-4 h-12 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: brand.primaryColor }}
        >
          AK
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900">Alex K.</span>
          <span className="text-xs text-gray-500">Premium</span>
        </div>
        <ChevronDown className="text-gray-400" size={18} />
      </button>
    </header>
  );
}