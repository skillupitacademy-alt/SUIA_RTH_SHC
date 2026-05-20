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
    <aside tabIndex={0} aria-label="Progress and stats sidebar" className={`fixed bottom-0 right-0 top-16 z-40 flex w-[78vw] flex-col overflow-y-auto bg-[#f8fafc] p-4 hide-scrollbar focus:outline-none transition-all duration-300 sm:p-5 min-[560px]:w-[min(400px,calc(100vw-1rem))] ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}`}>
      <div className="space-y-4">
        

        {/* Achievements */}
        <section 
          aria-label="Achievements and badges"
          className="rounded-3xl bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)]"
          style={{ boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.05)` }}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Icons.Trophy size={16} className="text-amber-700" />
              <h2 className="break-words text-[14px] font-bold text-[#1e293b]">{data.achievements.title}</h2>
            </div>
            <button className="shrink-0 text-[11px] font-bold text-orange-800 transition-colors hover:text-orange-900">View All</button>
          </div>
          <div className="space-y-4">
            {data.achievements.items.map((item) => {
              const Icon = getIcon(item.icon);
              const colorClass = item.color === 'red' ? 'bg-rose-100 text-rose-950 border-rose-200' : 'bg-blue-100 text-blue-950 border-blue-200';
              return (
                <div key={item.id} className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${colorClass}`}>
                    <Icon size={20} className="fill-current" aria-hidden="true" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h3 className="break-words text-[12px] font-bold text-slate-950">{item.title}</h3>
                    <p className="break-words text-[11px] font-medium text-slate-800">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weakness Analysis */}
        <section 
          aria-label="Learning weakness analysis"
          className="rounded-3xl p-5 shadow-2xl border-t border-white/20 backdrop-blur-xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
          style={{ backgroundColor: '#1d4ed8', boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.08)` }}
        >
          <div className="mb-5 flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
              <Icons.BarChart2 size={16} />
            </div>
            <h2 className="text-[14px] font-bold text-white">{data.weaknessAnalysis.title}</h2>
          </div>
          
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-white">Your Score</span>
              <span className="text-[32px] font-bold text-white leading-none">{data.weaknessAnalysis.score}%</span>
            </div>
            <span className="mt-3 break-words text-[12px] font-bold text-white">{data.weaknessAnalysis.scoreLabel}</span>
          </div>
          
          <ul className="mb-5 space-y-2">
            {data.weaknessAnalysis.items.map((item) => {
              return (
                <li key={item.id} className="flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-xs text-white" aria-hidden="true">-</span>
                    <span className="break-words text-[12px] font-bold text-white">{item.topic}</span>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/30 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {item.status}
                  </span>
                </li>
              );
            })}
          </ul>

          <button 
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-[12px] font-bold transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 border border-white"
            style={{ color: '#1d4ed8' }}
          >
            View Detailed Analysis <Icons.ArrowRight size={14} aria-hidden="true" />
          </button>
        </section>

        {/* Tutor Chat Box */}
        <section 
          aria-label="AI tutor chat interface"
          className="rounded-3xl p-5 shadow-2xl border-t border-white/20 backdrop-blur-xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
          style={{ backgroundColor: '#7e22ce', boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.08)` }}
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white border border-white/10">
              <Icons.Bot size={18} aria-hidden="true" />
            </div>
            <h2 className="break-words text-[15px] font-bold text-white">{data.aiTutor.title}</h2>
          </div>
          <p className="mb-4 text-[12px] font-medium text-white leading-relaxed whitespace-pre-line">
            {data.aiTutor.subtitle}
          </p>

          <div className="relative mb-4">
            <input 
              type="text" 
              aria-label={`Ask ${brand.tutorLabel}`}
              placeholder={data.aiTutor.inputPlaceholder}
              className="w-full rounded-xl bg-white py-3 pl-4 pr-10 text-[12px] font-medium text-slate-900 placeholder:text-slate-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-white border-none"
            />
            <button aria-label="Send message" className="absolute right-3 top-2.5 text-[#7e22ce] hover:text-[#581c87] transition-colors bg-purple-50 p-1 rounded-lg">
              <Icons.Send size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.aiTutor.examples.map((ex, i) => (
              <button key={i} className="rounded-lg bg-white/30 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-white/40 transition-colors border border-white/10">
                {ex}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
