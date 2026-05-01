'use client';

import React from 'react';
import { 
  FileText, Monitor, Youtube, Palette, BookOpen, 
  Play, Copy, Maximize2, ArrowRight, ClipboardList, 
  Rocket, HelpCircle 
} from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { ContentCardData } from '../../../subtopicPageData';

interface SubtopicContentGridProps {
  content: ContentCardData[];
  tasks: ContentCardData[];
}

export function SubtopicContentGrid({ content, tasks }: SubtopicContentGridProps) {
  const brand = useBrand();

  const getIcon = (type: string) => {
    switch (type) {
      case 'notes': return <FileText size={20} className="text-[#3b82f6]" />;
      case 'layman': return <span className="text-xl">👨‍🏫</span>;
      case 'example': return <span className="text-xl">🌍</span>;
      case 'code': return <Monitor size={20} className="text-gray-800" />;
      case 'deep-dive': return <Palette size={20} className="text-[#3b82f6]" />;
      case 'visual': return <Youtube size={20} className="text-[#1e293b]" />;
      case 'practice': return <span className="text-xl">✍️</span>;
      case 'assignment': return <ClipboardList size={20} className="text-amber-600" />;
      case 'project': return <Rocket size={20} style={{ color: brand.primaryColor }} />;
      case 'quiz': return <HelpCircle size={20} style={{ color: brand.primaryColor }} />;
      default: return <BookOpen size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="sr-only">Learning Content</h2>
      {/* Learning Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {content.map((card) => {
          const isCode = card.type === 'code';
          return (
            <div 
              key={card.id}
              className="group relative flex flex-col rounded-2xl bg-white p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center justify-center">
                  {getIcon(card.type)}
                </div>
                <h3 className="text-[15px] font-bold text-[#1e293b]">{card.title}</h3>
              </div>
              
              {isCode ? (
                <div className="flex flex-col flex-1">
                  <div className="relative overflow-hidden rounded-xl bg-[#1e293b] p-4 text-[13px] leading-relaxed text-slate-300 font-mono shadow-inner mb-4">
                    <div className="absolute right-3 top-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">JavaScript</div>
                    <pre className="hide-scrollbar overflow-x-auto whitespace-pre-wrap"><code>{card.code}</code></pre>
                  </div>
                  <div className="mt-auto flex items-center gap-3">
                    <button 
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold text-white transition-colors"
                      style={{ backgroundColor: brand.primaryColor }}
                    >
                      <Play size={14} className="fill-white" /> {card.ctaLabel}
                    </button>
                    <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                      <Copy size={14} /> Copy
                    </button>
                    <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                      <Maximize2 size={14} /> Expand
                    </button>
                  </div>
                </div>
              ) : card.type === 'visual' ? (
                <div className="flex flex-col flex-1">
                  <div className="relative mb-4 flex-1 overflow-hidden rounded-xl bg-green-50 border border-green-100/50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm cursor-pointer hover:bg-black/50 transition-all">
                        <Play size={20} className="fill-white ml-1" />
                      </div>
                    </div>
                    <div className="text-xs text-green-800 opacity-60 font-medium text-center">{card.content}</div>
                  </div>
                  <button 
                    className="mt-auto flex items-center gap-1 text-[13px] font-bold transition-colors"
                    style={{ color: brand.primaryColor }}
                  >
                    {card.ctaLabel}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="mb-6 flex-1 text-[13px] font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {card.content}
                  </div>
                  <button 
                    className="mt-auto flex items-center gap-1 text-[13px] font-bold transition-colors"
                    style={{ color: brand.primaryColor }}
                  >
                    {card.ctaLabel} <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="sr-only">Practical Tasks</h2>
      {/* Interactive Tasks Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {tasks.map((task) => {
          const isQuiz = task.type === 'quiz';
          return (
            <div 
              key={task.id}
              className="group flex flex-col rounded-2xl bg-white p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center justify-center">
                  {getIcon(task.type)}
                </div>
                <h3 className="text-[15px] font-bold text-[#1e293b]">{task.title}</h3>
              </div>
              
              <div className="mb-4 flex-1 text-[13px] font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.content}
              </div>

              {task.badge && (
                <div className="mb-5 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {task.badge.text}
                  </span>
                  {task.type === 'assignment' && (
                    <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-yellow-100">
                      +50 XP
                    </span>
                  )}
                  {task.type === 'project' && (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700 border border-green-100">
                      +150 XP
                    </span>
                  )}
                </div>
              )}

              <button
                className="mt-auto w-fit flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold transition-all"
                style={
                  isQuiz 
                    ? { backgroundColor: brand.primaryColor, color: 'white' } 
                    : task.type === 'assignment' 
                      ? { border: `1px solid ${brand.primaryColor}33`, backgroundColor: `${brand.primaryColor}11`, color: brand.primaryColorDark || brand.primaryColor }
                      : { color: brand.primaryColor, paddingLeft: 0, paddingRight: 0 }
                }
              >
                {task.ctaLabel} <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
