'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Flame, User, Menu, PanelRightClose, PanelRightOpen } from 'lucide-react';
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
  isLeftOpen: boolean;
  isRightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

export function SubtopicTopBar({ data, isLeftOpen, isRightOpen, onToggleLeft, onToggleRight }: SubtopicTopBarProps) {
  const brand = useBrand();

  return (
    <nav aria-label="Top navigation" className="sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm sm:px-6">
      {/* Left: Branding & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleLeft}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label={isLeftOpen ? 'Close curriculum sidebar' : 'Open curriculum sidebar'}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-white shadow-lg shadow-primary/20"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {brand.name.charAt(0)}
        </div>
        <div className="hidden h-8 w-px bg-slate-100 sm:block"></div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            <span>{data.courseLabel}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-950">{data.lessonLabel}</span>
          </div>
          <div className="text-sm font-bold text-slate-950">{brand.name}</div>
        </div>
      </div>

      {/* Right: Dashboard Link, Streak, Profile */}
      <div className="flex items-center gap-6">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-900 transition-all hover:bg-slate-200 border border-slate-200"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          {data.dashboardCtaLabel}
        </Link>

        <div className="flex items-center gap-4 pl-6">
          {/* Streak */}
          <div className="flex items-center gap-1.5">
            <Flame size={18} fill="currentColor" style={{ color: brand.primaryColor }} aria-hidden="true" />
            <span className="text-sm font-bold text-slate-950">{data.streak}</span>
          </div>

          {/* XP */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800 leading-none">Total XP</span>
            <span className="text-sm font-bold text-primary leading-none" style={{ color: brand.primaryColor }}>
              {data.xpPoints.toLocaleString()}
            </span>
          </div>

          {/* Profile Circle */}
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {data.learnerInitials}
          </div>

          <div className="h-6 w-px bg-slate-100 mx-2"></div>

          {/* Right Sidebar Toggle */}
          <button 
            onClick={onToggleRight}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label={isRightOpen ? 'Close stats sidebar' : 'Open stats sidebar'}
          >
            {isRightOpen ? <PanelRightClose size={20} aria-hidden="true" /> : <PanelRightOpen size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </nav>
  );
}
