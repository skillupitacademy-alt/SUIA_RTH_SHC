'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Achievement, Weakness } from '../../../subtopicPageData';

export interface SubtopicRightPanelProps {
  data: {
    xpSection: {
      title: string;
      earnedXp: number;
      totalXp: number;
      xpMessage: string;
    };
    achievements: {
      title: string;
      items: Achievement[];
    };
    weaknessAnalysis: {
      title: string;
      score: number;
      scoreLabel: string;
      items: Weakness[];
    };
    aiTutor: {
      title: string;
      subtitle: string;
      inputPlaceholder: string;
      examples: string[];
    };
  };
  isOpen: boolean;
}

export function SubtopicRightPanel({ data, isOpen }: SubtopicRightPanelProps) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    return (Icons as any)[iconName] || Icons.Award;
  };

  return (
    <aside tabIndex={0} aria-label="Progress and stats sidebar" className={`absolute bottom-0 right-0 top-0 z-40 flex w-[400px] flex-col overflow-y-auto bg-[#f8fafc] p-5 hide-scrollbar focus:outline-none transition-all duration-300 ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}`}>
      <div className="space-y-4">
        
        {/* XP Section */}
        <section className="rounded-3xl bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                 style={{ boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.05)` }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Flame size={18} className="text-orange-700" />
              <h2 className="text-[14px] font-bold text-[#1e293b]">{data.xpSection.title}</h2>
            </div>
            <span className="text-[11px] font-black text-emerald-800">+{data.xpSection.totalXp} XP</span>
          </div>
          
          <div className="mb-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800">You will earn</span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-[32px] font-black text-[#1e293b] leading-none">{data.xpSection.totalXp}</span>
                <span className="text-[14px] font-black text-[#1e293b]">XP</span>
              </div>
              <span className="text-[11px] font-black text-slate-800">{data.xpSection.xpMessage}</span>
            </div>
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg shadow-orange-500/30 relative">
               <div className="absolute inset-1 rounded-full bg-white/10"></div>
               <Icons.Star size={32} className="text-white drop-shadow-md" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 flex">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(data.xpSection.earnedXp / data.xpSection.totalXp) * 100}%` }} />
            </div>
            <div className="text-[10px] font-black text-slate-800">
              <span className="text-gray-900">{data.xpSection.earnedXp}</span> / {data.xpSection.totalXp} XP
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section 
          className="rounded-3xl bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          style={{ boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.05)` }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Trophy size={16} className="text-amber-700" />
              <h2 className="text-[14px] font-bold text-[#1e293b]">{data.achievements.title}</h2>
            </div>
            <button className="text-[11px] font-bold text-orange-800 hover:text-orange-900 transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {data.achievements.items.map((item) => {
              const Icon = getIcon(item.icon);
              const colorClass = item.color === 'red' ? 'bg-rose-100 text-rose-900 border-rose-200' : 'bg-blue-100 text-blue-900 border-blue-200';
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${colorClass}`}>
                    <Icon size={20} className="fill-current" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[12px] font-black text-slate-900">{item.title}</h3>
                    <p className="text-[11px] font-black text-slate-700">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weakness Analysis */}
        <section 
          className="rounded-3xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          style={{ backgroundColor: '#1d4ed8', boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.08)` }}
        >
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
              <Icons.BarChart2 size={16} />
            </div>
            <h2 className="text-[14px] font-bold text-white">{data.weaknessAnalysis.title}</h2>
          </div>
          
          <div className="mb-5 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white/95">Your Score</span>
              <span className="text-[32px] font-black text-white leading-none">{data.weaknessAnalysis.score}%</span>
            </div>
            <span className="text-[12px] font-black text-white mt-3">{data.weaknessAnalysis.scoreLabel}</span>
          </div>
          
          <ul className="mb-5 space-y-2">
            {data.weaknessAnalysis.items.map((item) => {
              return (
                <li key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 text-xs">•</span>
                    <span className="text-[12px] font-black text-white">{item.topic}</span>
                  </div>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black text-white">
                    {item.status}
                  </span>
                </li>
              );
            })}
          </ul>

          <button 
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-[12px] font-black transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 border border-white"
            style={{ color: '#1d4ed8' }}
          >
            View Detailed Analysis <Icons.ArrowRight size={14} />
          </button>
        </section>

        {/* AI Tutor Chat Box */}
        <section 
          className="rounded-3xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          style={{ backgroundColor: '#7e22ce', boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.08)` }}
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
              <Icons.Bot size={18} />
            </div>
            <h2 className="text-[15px] font-bold text-white">{data.aiTutor.title}</h2>
          </div>
          <p className="mb-4 text-[12px] font-black text-white leading-relaxed whitespace-pre-line">
            {data.aiTutor.subtitle}
          </p>

          <div className="relative mb-4">
            <input 
              type="text" 
              aria-label="Ask AI Tutor"
              placeholder={data.aiTutor.inputPlaceholder}
              className="w-full rounded-xl bg-white py-3 pl-4 pr-10 text-[12px] font-medium text-gray-700 placeholder:text-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white border-none"
            />
            <button aria-label="Send message" className="absolute right-3 top-2.5 text-[#7e22ce] hover:text-[#581c87] transition-colors bg-purple-50 p-1 rounded-lg">
              <Icons.Send size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.aiTutor.examples.map((ex, i) => (
              <button key={i} className="rounded-lg bg-white/20 px-3 py-1.5 text-[10px] font-black text-white shadow-sm hover:bg-white/30 transition-colors border border-white/10">
                {ex}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
