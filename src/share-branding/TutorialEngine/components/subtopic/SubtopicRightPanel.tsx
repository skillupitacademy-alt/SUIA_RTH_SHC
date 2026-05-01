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
    <aside tabIndex={0} aria-label="Progress and stats sidebar" className={`absolute bottom-0 right-0 top-0 z-40 flex w-[400px] flex-col overflow-y-auto border-l border-gray-200 bg-[#f8fafc] p-5 hide-scrollbar focus:outline-none transition-all duration-300 ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}`}>
      <div className="space-y-4">
        
        {/* XP Section */}
        <section className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Flame size={18} className="text-orange-500" />
              <h2 className="text-[14px] font-bold text-[#1e293b]">{data.xpSection.title}</h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-500">+{data.xpSection.totalXp} XP</span>
          </div>
          
          <div className="mb-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-gray-500">You will earn</span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-[32px] font-black text-[#1e293b] leading-none">{data.xpSection.totalXp}</span>
                <span className="text-[14px] font-bold text-[#1e293b]">XP</span>
              </div>
              <span className="text-[11px] font-medium text-gray-500">{data.xpSection.xpMessage}</span>
            </div>
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 border-4 border-orange-100 relative">
               <div className="absolute inset-1 rounded-full border border-orange-300/50"></div>
               <Icons.Star size={32} className="text-yellow-200 fill-yellow-200 drop-shadow-md" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 flex">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(data.xpSection.earnedXp / data.xpSection.totalXp) * 100}%` }} />
            </div>
            <div className="text-[10px] font-bold text-gray-500">
              <span className="text-gray-800">{data.xpSection.earnedXp}</span> / {data.xpSection.totalXp} XP
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Trophy size={16} className="text-amber-500" />
              <h2 className="text-[14px] font-bold text-[#1e293b]">{data.achievements.title}</h2>
            </div>
            <button className="text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {data.achievements.items.map((item) => {
              const Icon = getIcon(item.icon);
              const colorClass = item.color === 'red' ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-500';
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon size={20} className="fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[12px] font-bold text-[#1e293b]">{item.title}</h3>
                    <p className="text-[11px] font-medium text-gray-500">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weakness Analysis */}
        <section className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Icons.BarChart2 size={16} className="text-blue-500" />
            <h2 className="text-[14px] font-bold text-[#1e293b]">{data.weaknessAnalysis.title}</h2>
          </div>
          
          <div className="mb-5 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-gray-500">Your Score</span>
              <span className="text-[32px] font-black text-[#1e293b] leading-none">{data.weaknessAnalysis.score}%</span>
            </div>
            <span className="text-[12px] font-bold text-orange-500 mt-3">{data.weaknessAnalysis.scoreLabel}</span>
          </div>
          
          <ul className="mb-5 space-y-2">
            {data.weaknessAnalysis.items.map((item) => {
              const badgeClass = item.status === 'Weak' 
                ? 'bg-rose-50 text-rose-500' 
                : 'bg-amber-50 text-amber-500';
              return (
                <li key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-[12px] font-medium text-[#475569]">{item.topic}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                    {item.status}
                  </span>
                </li>
              );
            })}
          </ul>

          <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-50 py-2.5 text-[12px] font-bold text-orange-600 transition-colors hover:bg-orange-100">
            View Detailed Analysis <Icons.ArrowRight size={14} />
          </button>
        </section>

        {/* AI Tutor Chat Box */}
        <section className="rounded-2xl bg-[#f5f3ff] p-5 border border-purple-100">
          <div className="mb-3 flex items-center gap-2">
            <Icons.Bot size={18} className="text-[#6d28d9]" />
            <h2 className="text-[15px] font-bold text-[#6d28d9]">{data.aiTutor.title}</h2>
          </div>
          <p className="mb-4 text-[12px] font-medium text-[#4c1d95] leading-relaxed whitespace-pre-line">
            {data.aiTutor.subtitle}
          </p>

          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder={data.aiTutor.inputPlaceholder}
              className="w-full rounded-xl bg-white py-3 pl-4 pr-10 text-[12px] font-medium text-gray-700 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 border border-purple-50"
            />
            <button className="absolute right-3 top-2.5 text-purple-300 hover:text-purple-500 transition-colors">
              <Icons.Send size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.aiTutor.examples.map((ex, i) => (
              <button key={i} className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-[#6d28d9] shadow-sm hover:bg-purple-50 transition-colors border border-purple-100">
                {ex}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
