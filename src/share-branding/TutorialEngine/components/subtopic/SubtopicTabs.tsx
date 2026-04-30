'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface SubtopicTabsProps {
  tabs: { id: string; label: string; icon: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function SubtopicTabs({ tabs, activeTab, onTabChange }: SubtopicTabsProps) {
  const brand = useBrand();

  return (
    <div className="flex w-full items-center gap-1 overflow-x-auto pb-2 hide-scrollbar border-b border-gray-100">
      {tabs.map((tab) => {
        const IconComponent = (Icons as any)[tab.icon] || Icons.BookOpen;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition-all ${
              isActive 
                ? 'bg-white text-gray-900 shadow-lg shadow-slate-100 -translate-y-1' 
                : 'text-gray-400 hover:bg-white hover:text-gray-600'
            }`}
          >
            <IconComponent 
              size={18} 
              className={isActive ? '' : 'text-gray-300'} 
              style={isActive ? { color: brand.primaryColor } : {}} 
            />
            <span>{tab.label}</span>
            {isActive && (
              <div 
                className="ml-1 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: brand.primaryColor }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
