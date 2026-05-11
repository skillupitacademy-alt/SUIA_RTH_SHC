'use client';

import React from 'react';
import { Target, Lightbulb, Zap } from 'lucide-react';

interface PracticeHeroProps {
  data: {
    practiceTitle: string;
    description: string;
    learningGoal: string;
    pointsAvailable: number;
  };
  themeColor: string;
}

export function PracticeHero({ data, themeColor }: PracticeHeroProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] p-8 md:p-12 shadow-2xl">
      {/* Dynamic Aura */}
      <div 
        className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-[0.07] blur-[120px]"
        style={{ backgroundColor: themeColor }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-start justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <Target size={18} style={{ color: themeColor }} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Interactive Lab</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter leading-tight">
            {data.practiceTitle}
          </h2>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            {data.description}
          </p>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-yellow-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Learning Goal</span>
            </div>
            <p className="text-sm font-bold text-slate-200">
              {data.learningGoal}
            </p>
          </div>

          <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Zap size={16} className="text-orange-400" />
              </div>
              <span className="text-xs font-bold text-slate-400">XP Points</span>
            </div>
            <span className="text-2xl font-black text-white">+{data.pointsAvailable}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
