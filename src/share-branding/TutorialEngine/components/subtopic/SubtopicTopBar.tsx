'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Flame, User } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface SubtopicTopBarProps {
  data: {
    courseLabel: string;
    lessonLabel: string;
    dashboardCtaLabel: string;
    streak: number;
    xpPoints: number;
    learnerInitials: string;
  };
}

export function SubtopicTopBar({ data }: SubtopicTopBarProps) {
  const brand = useBrand();

  return (
    <nav className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Left: Branding & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-black text-white shadow-lg shadow-primary/20"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {brand.name.charAt(0)}
        </div>
        <div className="hidden h-8 w-px bg-gray-200 sm:block"></div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <span>{data.courseLabel}</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600">{data.lessonLabel}</span>
          </div>
          <h2 className="text-sm font-extrabold text-gray-800">{brand.name}</h2>
        </div>
      </div>

      {/* Right: Dashboard Link, Streak, Profile */}
      <div className="flex items-center gap-6">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-bold text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300"
        >
          <ChevronLeft size={14} />
          {data.dashboardCtaLabel}
        </Link>

        <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
          {/* Streak */}
          <div className="flex items-center gap-1.5">
            <Flame size={18} className="text-orange-500 fill-orange-500" />
            <span className="text-sm font-black text-gray-800">{data.streak}</span>
          </div>

          {/* XP */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 leading-none">Total XP</span>
            <span className="text-sm font-black text-primary leading-none" style={{ color: brand.primaryColor }}>
              {data.xpPoints.toLocaleString()}
            </span>
          </div>

          {/* Profile Circle */}
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {data.learnerInitials}
          </div>
        </div>
      </div>
    </nav>
  );
}
