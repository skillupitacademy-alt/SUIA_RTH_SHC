'use client';

import React from 'react';
import { Eye, Image as ImageIcon, Sparkles } from 'lucide-react';

interface VisualHeroProps {
  data: {
    heroTitle: string;
    description: string;
    keyObservation: string;
  };
  themeColor: string;
}

export function VisualHero({ data, themeColor }: VisualHeroProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#050816] p-8 md:p-12 shadow-2xl">
      {/* Background Glow */}
      <div 
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10 blur-[100px]"
        style={{ backgroundColor: themeColor }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
            <Eye size={18} style={{ color: themeColor }} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Visual Conceptualization</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter leading-tight">
              {data.heroTitle}
            </h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              {data.description}
            </p>
          </div>

          <div className="w-full lg:w-80">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md relative group">
              <Sparkles size={16} className="absolute top-4 right-4 text-orange-500/50 group-hover:text-orange-500 transition-colors" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Key Observation</h4>
              <p className="text-sm font-bold text-slate-200 leading-relaxed italic">
                "{data.keyObservation}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
