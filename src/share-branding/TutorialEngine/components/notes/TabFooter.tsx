'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface TabFooterProps {
  prevLabel?: string;
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
}

export function TabFooter({ prevLabel, nextLabel, onPrev, onNext }: TabFooterProps) {
  const brand = useBrand();

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
      {/* Previous Button */}
      {prevLabel ? (
        <button 
          onClick={onPrev}
          className="group flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:bg-slate-50 active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-white transition-colors">
            <Icons.ArrowLeft size={18} className="text-slate-600 group-hover:text-slate-900" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previous</p>
            <p className="break-words text-sm font-bold text-slate-900">{prevLabel}</p>
          </div>
        </button>
      ) : (
        <div className="flex-1 hidden sm:block" />
      )}

      {/* Back to Overview / Center Button */}
      <button 
        onClick={() => window.location.href = '/start-learning/subtopic'}
        className="hidden shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 lg:flex"
      >
        <Icons.LayoutGrid size={18} aria-hidden="true" />
        Back to Overview
      </button>

      {/* Next Button */}
      {nextLabel ? (
        <button 
          onClick={onNext}
          className="group flex min-w-0 flex-1 items-center justify-between gap-4 rounded-2xl p-4 text-left text-white shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Next</p>
            <p className="break-words text-sm font-bold">{nextLabel}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Icons.ArrowRight size={18} aria-hidden="true" />
          </div>
        </button>
      ) : (
        <div className="flex-1 hidden sm:block" />
      )}
    </div>
  );
}
