'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface NotesHeroProps {
  data: {
    heroTitle: string;
    heroSubtitle: string;
    quickLook: string[];
  };
  themeColor: string;
}

export function NotesHero({ data, themeColor }: NotesHeroProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] p-8 md:p-12 shadow-2xl">
      {/* Abstract Background Elements */}
      <div 
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: themeColor }}
      />
      <div 
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-5 blur-3xl bg-orange-500"
      />

      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={16} style={{ color: themeColor }} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Academic Overview</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-tight">
            {data.heroTitle}
          </h2>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            {data.heroSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {data.quickLook.map((tag, idx) => (
            <div 
              key={idx}
              className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-300 shadow-sm"
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
