'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Achievement, Weakness } from '../../../subtopicPageData';

interface SubtopicRightPanelProps {
  data: {
    xpSection: { title: string; earnedXp: number; totalXp: number; xpMessage: string };
    achievements: { title: string; items: Achievement[] };
    weaknessAnalysis: { title: string; score: number; scoreLabel: string; items: Weakness[] };
    aiTutor: { title: string; subtitle: string; inputPlaceholder: string; examples: string[] };
  };
}

export function SubtopicRightPanel({ data }: SubtopicRightPanelProps) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    return (Icons as any)[iconName] || Icons.Award;
  };

  return (
    <aside className="hidden w-80 flex-col overflow-y-auto border-l border-gray-200 bg-white p-6 xl:flex hide-scrollbar">
      <div className="space-y-8">
        {/* XP Section */}
        <section className="rounded-3xl bg-slate-50 p-6 border border-slate-100 shadow-sm">
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">{data.xpSection.title}</h3>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-black text-gray-800">{data.xpSection.earnedXp}</span>
            <span className="mb-1.5 text-sm font-bold text-gray-400">/ {data.xpSection.totalXp} XP</span>
          </div>
          <p className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
            {data.xpSection.xpMessage}
          </p>
        </section>

        {/* Achievements */}
        <section>
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">{data.achievements.title}</h3>
          <div className="space-y-3">
            {data.achievements.items.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-${item.color}-50 text-${item.color}-500`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-800">{item.title}</h4>
                    <p className="text-[10px] font-medium text-gray-400">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weakness Analysis */}
        <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{data.weaknessAnalysis.title}</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-black">
              {data.weaknessAnalysis.score}%
            </div>
          </div>
          
          <div className="mb-6 space-y-3">
            {data.weaknessAnalysis.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-medium text-slate-300">{item.topic}</span>
                <span className={`text-[10px] font-black uppercase text-${item.color}-400`}>{item.status}</span>
              </div>
            ))}
          </div>

          <button className="w-full rounded-xl bg-slate-800 py-3 text-xs font-black transition-colors hover:bg-slate-700">
            View Analytics
          </button>
        </section>

        {/* AI Tutor Chat Box */}
        <section className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg" style={{ backgroundColor: brand.primaryColor }}>
          <div className="relative z-10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Icons.Brain size={24} />
            </div>
            <h3 className="mb-1 text-lg font-black">{data.aiTutor.title}</h3>
            <p className="mb-6 text-xs font-medium text-white/80">{data.aiTutor.subtitle}</p>

            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder={data.aiTutor.inputPlaceholder}
                className="w-full rounded-xl bg-white/10 py-3 pl-4 pr-10 text-xs font-medium placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <Icons.Send size={14} className="absolute right-3 top-3.5 text-white/50" />
            </div>

            <div className="flex flex-wrap gap-2">
              {data.aiTutor.examples.map((ex, i) => (
                <button key={i} className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold hover:bg-white/20 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Decorative Orbs */}
          <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-black/10 blur-xl" />
        </section>
      </div>
    </aside>
  );
}
