'use client';

import React from 'react';
import { 
  FileText, Monitor, Youtube, Palette, BookOpen, 
  Play, Copy, Maximize2, ArrowRight, ClipboardList, 
  Rocket, HelpCircle, Lightbulb, Globe, Pencil 
} from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { ContentCardData } from '../../../subtopicPageData';

interface SubtopicContentGridProps {
  content: ContentCardData[];
  tasks: ContentCardData[];
}

export function SubtopicContentGrid({ content, tasks }: SubtopicContentGridProps) {
  const brand = useBrand();

  const getIcon = (type: string, isWhite?: boolean) => {
    const size = isWhite ? 28 : 20;
    switch (type) {
      case 'notes': return <FileText size={size} className={isWhite ? 'text-white' : 'text-[#3b82f6]'} />;
      case 'layman': return <Lightbulb size={size} className={isWhite ? 'text-white' : 'text-amber-500'} />;
      case 'example': return <Globe size={size} className={isWhite ? 'text-white' : 'text-emerald-500'} />;
      case 'code': return <Monitor size={size} className={isWhite ? 'text-white' : 'text-gray-800'} />;
      case 'deep-dive': return <Palette size={size} className={isWhite ? 'text-white' : 'text-[#3b82f6]'} />;
      case 'visual': return <Youtube size={size} className={isWhite ? 'text-white' : 'text-[#1e293b]'} />;
      case 'practice': return <Pencil size={size} className={isWhite ? 'text-white' : 'text-purple-500'} />;
      case 'assignment': return <ClipboardList size={size} className={isWhite ? 'text-white' : 'text-amber-600'} />;
      case 'project': return <Rocket size={size} className={isWhite ? 'text-white' : ''} style={!isWhite ? { color: brand.primaryColor } : {}} />;
      case 'quiz': return <HelpCircle size={size} className={isWhite ? 'text-white' : ''} style={!isWhite ? { color: brand.primaryColor } : {}} />;
      default: return <BookOpen size={size} className={isWhite ? 'text-white' : 'text-gray-500'} />;
    }
  };

  const getTaskBgColor = (type: string) => {
    switch (type) {
      case 'practice': return '#15803d'; // Green-700
      case 'assignment': return '#1d4ed8'; // Blue-700
      case 'project': return '#c2410c'; // Orange-700
      case 'quiz': return '#7e22ce'; // Purple-700
      default: return '#1e293b';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="sr-only">Learning Content</h2>
      {/* Learning Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {content.map((card) => {
          const isCode = card.type === 'code';
          return (
            <div 
              key={card.id}
              className="group flex min-w-0 flex-col rounded-3xl border bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6 min-h-[320px]"
              style={{ 
                borderColor: `${brand.primaryColor}22`,
                boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.05)`
              }}
            >
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <div 
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-inner"
                    style={{ backgroundColor: brand.primaryColor, color: '#ffffff' }}
                  >
                    {getIcon(card.type, true)}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h3 className="break-words text-lg font-black leading-tight text-gray-900">
                      {card.title}
                    </h3>
                  </div>
                </div>
              </div>
              
              {isCode ? (
                <div className="flex flex-col flex-1">
                  <div className="relative overflow-hidden rounded-xl bg-[#1e293b] p-4 text-[13px] leading-relaxed text-slate-300 font-mono shadow-inner mb-4">
                    <div className="absolute right-3 top-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">JavaScript</div>
                    <pre className="hide-scrollbar overflow-x-auto whitespace-pre-wrap"><code>{card.code}</code></pre>
                  </div>
                  <div className="mt-auto flex items-center gap-3 border-t border-gray-50 pt-4">
                    <button 
                      className="min-w-0 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
                      style={{ backgroundColor: brand.primaryColor }}
                    >
                      <span className="flex items-center gap-1.5"><Play size={14} className="fill-white" /> {card.ctaLabel}</span>
                    </button>
                    <button className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors">
                      <Copy size={14} /> Copy
                    </button>
                  </div>
                </div>
              ) : card.type === 'visual' ? (
                <div className="flex flex-col flex-1">
                  <div className="relative mb-6 flex-1 overflow-hidden rounded-xl bg-green-50 border border-green-100/50 flex items-center justify-center p-4 min-h-[120px]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm cursor-pointer hover:bg-black/50 transition-all shadow-lg">
                        <Play size={20} className="fill-white ml-1" />
                      </div>
                    </div>
                    <div className="text-xs text-green-800 opacity-60 font-medium text-center z-0">{card.content}</div>
                  </div>
                  <div className="mt-auto flex items-center border-t border-gray-50 pt-4">
                    <button 
                      className="group flex items-center gap-1.5 text-xs font-black transition-colors"
                      style={{ color: brand.primaryColor }}
                    >
                      {card.ctaLabel} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <p className="mb-6 flex-1 text-[13px] font-medium leading-relaxed text-gray-600 whitespace-pre-wrap">
                    {card.content}
                  </p>
                  <div className="mt-auto flex items-center border-t border-gray-50 pt-4">
                    <button 
                      className="group flex items-center gap-1.5 text-xs font-black transition-colors"
                      style={{ color: brand.primaryColor }}
                    >
                      {card.ctaLabel} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="sr-only">Practical Tasks</h2>
      {/* Interactive Tasks Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tasks.map((task) => {
          const bgColor = getTaskBgColor(task.type);
          return (
            <div 
              key={task.id}
              className="group flex min-w-0 flex-col rounded-3xl border p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6 min-h-[320px]"
              style={{ 
                backgroundColor: bgColor,
                borderColor: `${brand.primaryColor}22`,
                boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.05)`
              }}
            >
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <div 
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-inner bg-white/20"
                    style={{ color: '#ffffff' }}
                  >
                    {getIcon(task.type, true)}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h3 className="break-words text-lg font-black leading-tight text-white">
                      {task.title}
                    </h3>
                  </div>
                </div>
              </div>
              
              <div className="mb-6 flex-1 text-[13px] font-medium leading-relaxed text-white/90 whitespace-pre-wrap">
                {task.content}
              </div>

              {task.badge && (
                <div className="mb-6 flex items-center gap-2">
                  <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/10 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" /> {task.badge.text}
                  </span>
                  {task.type === 'assignment' && (
                    <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/10">
                      +50 XP
                    </span>
                  )}
                  {task.type === 'project' && (
                    <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/10">
                      +150 XP
                    </span>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center border-t border-white/10 pt-4">
                <button
                  className="w-full min-w-0 rounded-xl bg-white px-4 py-2.5 text-xs font-black shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
                  style={{ color: bgColor }}
                >
                  <span className="flex items-center justify-center gap-1.5">{task.ctaLabel} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
