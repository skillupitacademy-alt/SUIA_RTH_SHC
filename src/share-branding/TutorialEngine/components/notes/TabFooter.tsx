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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      {/* Previous Button */}
      {prevLabel ? (
        <button 
          onClick={onPrev}
          className="group flex flex-1 items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition-all border border-slate-100 hover:bg-slate-50 active:scale-95 w-full sm:w-auto"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-white transition-colors">
            <Icons.ArrowLeft size={18} className="text-slate-600 group-hover:text-slate-900" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previous</p>
            <p className="text-sm font-bold text-slate-900">{prevLabel}</p>
          </div>
        </button>
      ) : (
        <div className="flex-1 hidden sm:block" />
      )}

      {/* Back to Overview / Center Button */}
      <button 
        onClick={() => window.location.href = '/start-learning/subtopic'}
        className="hidden lg:flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
      >
        <Icons.LayoutGrid size={18} aria-hidden="true" />
        Back to Overview
      </button>

      {/* Next Button */}
      {nextLabel ? (
        <button 
          onClick={onNext}
          className="group flex flex-1 items-center justify-between gap-4 rounded-2xl p-4 text-left shadow-xl transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto text-white"
          style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
        >
          <div>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Next</p>
            <p className="text-sm font-bold">{nextLabel}</p>
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
