'use client';

import React from 'react';
import { CheckCircle2, Rocket, ArrowLeft, Download, FileText, Bot, TrendingUp, Lock } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface SubtopicSidebarProps {
  data: {
    subtopicsTitle: string;
    items: {
      id: string;
      title: string;
      status: 'completed' | 'active' | 'locked';
      isCurrent?: boolean;
    }[];
  };
  progress: {
    percentage: number;
    checklist: { label: string; completed: boolean }[];
  };
  isOpen: boolean;
  onToggle: () => void;
}

export function SubtopicSidebar({ data, progress, isOpen, onToggle }: SubtopicSidebarProps) {
  const brand = useBrand();

  // Helper to convert hex to rgba for backgrounds
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const bgLight = hexToRgba(brand.primaryColor, 0.05);

  return (
    <aside aria-label="Curriculum sidebar" className={`absolute bottom-0 left-0 top-0 z-40 flex w-[350px] flex-col bg-white transition-all duration-300 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}`}>
      <div className="flex flex-col h-full">
        
        {/* Scrollable Content */}
        <div tabIndex={0} className="flex-1 overflow-y-auto px-6 py-6 hide-scrollbar focus:outline-none space-y-6">
          
          {/* Back Button */}
          <button 
            className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:brightness-95 border border-transparent hover:border-slate-200"
            style={{ backgroundColor: bgLight, color: brand.primaryColorDark || brand.primaryColor }}
            aria-label="Back to Course curriculum"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Course
          </button>

          <div className="rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-1 border border-slate-100 shadow-sm">
            <h2 className="mb-4 text-[13px] font-bold text-slate-800 uppercase tracking-widest">Subtopic Progress</h2>
            <div className="flex items-center gap-4">
              <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full">
                <svg className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                  <circle cx="34" cy="34" r="30" fill="none" strokeWidth="6" className="text-slate-100" stroke="currentColor" />
                  <circle 
                    cx="34" cy="34" r="30" fill="none" strokeWidth="6" stroke="currentColor" 
                    strokeDasharray="188.5" 
                    strokeDashoffset={188.5 - (188.5 * progress.percentage) / 100} 
                    style={{ color: brand.primaryColor, strokeLinecap: 'round' }} 
                  />
                </svg>
                <span className="text-base font-bold text-slate-950">{progress.percentage}%</span>
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-[13px] font-bold text-slate-950">Great Progress!</span>
                <span className="mb-2 text-xs font-medium text-slate-800">Keep it up 🚀</span>
                <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200/50 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progress.percentage}%`, backgroundColor: brand.primaryColor }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-2 transition-all duration-300 hover:-translate-y-1 border border-slate-100 shadow-sm">
            <div className="px-3 pb-2 pt-3">
              <div className="text-[13px] font-bold text-slate-950 uppercase tracking-widest">{data.subtopicsTitle}</div>
            </div>

            <div className="space-y-0.5">
              {data.items.map((item, idx) => {
                const isActive = item.status === 'active';
                const isCompleted = item.status === 'completed';
                
                return (
                  <button 
                    key={item.id}
                    type="button"
                    className="group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all"
                    style={{ backgroundColor: isActive ? bgLight : 'transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex w-5 items-center justify-center">
                         {isActive ? (
                          <Rocket size={16} style={{ color: brand.primaryColor }} aria-hidden="true" />
                        ) : isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-900" aria-hidden="true" />
                        ) : (
                          <Lock size={14} className="text-slate-700" aria-hidden="true" />
                        )}
                      </div>
                      <span 
                        className="text-[13px] font-bold"
                        style={{ color: isActive ? (brand.primaryColorDark || brand.primaryColor) : '#334155' }}
                      >
                        {idx + 1}. {item.title}
                      </span>
                    </div>
                    {/* Right side circle indicator */}
                    <div 
                      className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-current' : 'bg-slate-200'}`}
                      style={isActive ? { color: brand.primaryColor } : {}}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          
        </div>

        {/* Bottom Fixed Area */}
        <div className="bg-white px-6 py-5 space-y-4">
          <button 
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold transition-all hover:brightness-95"
            style={{ backgroundColor: bgLight, color: brand.primaryColorDark || brand.primaryColor }}
          >
            <Download size={16} />
            Download Notes (PDF)
            <FileText size={16} className="ml-1" />
          </button>

          <button className="flex w-full items-center gap-4 rounded-xl bg-[#F5F3FF] p-4 text-left transition-all border border-violet-100 hover:bg-[#EDE9FE] shadow-sm active:scale-[0.98]" aria-label="Ask AI Tutor for help">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#6D28D9] shadow-sm border border-violet-50">
              <Bot size={20} aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#6D28D9] uppercase tracking-widest">Need Help?</span>
              <span className="text-sm font-bold text-[#4C1D95]">Ask AI Tutor</span>
            </div>
          </button>
        </div>

      </div>
    </aside>
  );
}
