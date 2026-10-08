'use client';

import React from 'react';
import { Target, ArrowUpRight } from 'lucide-react';

interface CaseStudyCardProps {
  data: {
    title: string;
    challenge: string;
    solution: string;
    impact: string;
    companyLogo?: string;
  };
  themeColor: string;
}

export function CaseStudyCard({ data, themeColor }: CaseStudyCardProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl h-full flex flex-col">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Target size={120} style={{ color: themeColor }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-400 uppercase tracking-tighter">
            Real Case Study
          </div>
          <ArrowUpRight size={16} className="text-slate-600" />
        </div>

        <h3 className="text-xl font-black text-white mb-4 tracking-tight">{data.title}</h3>

        <div className="space-y-4 flex-1">
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Challenge</h4>
            <p className="text-sm text-slate-400 leading-relaxed">{data.challenge}</p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-1">Resolution</h4>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">{data.solution}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <span className="text-xs font-black text-slate-500">ROI</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Business Impact</div>
              <div className="text-sm font-black text-white">{data.impact}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
