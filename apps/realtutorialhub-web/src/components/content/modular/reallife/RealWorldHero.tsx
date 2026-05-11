'use client';

import React from 'react';
import { Globe, Briefcase } from 'lucide-react';

interface RealWorldHeroProps {
  data: {
    scenarioTitle: string;
    industryContext: string;
    marketRelevance: string;
  };
  themeColor: string;
}

export function RealWorldHero({ data, themeColor }: RealWorldHeroProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#050816] p-8 md:p-12 shadow-2xl">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* Decorative Glow */}
      <div 
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 blur-[100px]"
        style={{ backgroundColor: themeColor }}
      />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <Briefcase size={18} style={{ color: themeColor }} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Industry Scenario</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter leading-tight">
            {data.scenarioTitle}
          </h2>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            {data.industryContext}
          </p>
        </div>

        <div className="shrink-0 group">
          <div className="px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md transition-all group-hover:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Market Relevance</span>
            </div>
            <div className="text-sm font-bold text-slate-200">
              {data.marketRelevance}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
