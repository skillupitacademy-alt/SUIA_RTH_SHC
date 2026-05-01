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
    <div tabIndex={0} aria-label="Content sections" className="flex w-full items-center gap-1 overflow-x-auto pb-2 hide-scrollbar border-b border-gray-100 focus:outline-none">
      {tabs.map((tab) => {
        const IconComponent = (Icons as any)[tab.icon] || Icons.BookOpen;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 px-5 py-4 text-[14px] font-bold transition-all relative ${
              isActive 
                ? 'text-[#1e293b]' 
                : 'text-gray-500 hover:text-[#1e293b]'
            }`}
          >
            <IconComponent 
              size={18} 
              className={isActive ? '' : 'text-gray-400'} 
              style={isActive ? { color: brand.primaryColor } : {}} 
            />
            <span>{tab.label}</span>
            {isActive && (
              <div 
                className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full"
                style={{ backgroundColor: brand.primaryColor }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
