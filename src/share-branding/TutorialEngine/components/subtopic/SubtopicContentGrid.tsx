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
      case 'layman': return <Lightbulb size={size} className={isWhite ? 'text-white' : 'text-amber-700'} />;
      case 'example': return <Globe size={size} className={isWhite ? 'text-white' : 'text-emerald-700'} />;
      case 'code': return <Monitor size={size} className={isWhite ? 'text-white' : 'text-gray-800'} />;
      case 'deep-dive': return <Palette size={size} className={isWhite ? 'text-white' : 'text-[#3b82f6]'} />;
      case 'visual': return <Youtube size={size} className={isWhite ? 'text-white' : 'text-[#1e293b]'} />;
      case 'practice': return <Pencil size={size} className={isWhite ? 'text-white' : 'text-purple-500'} />;
      case 'assignment': return <ClipboardList size={size} className={isWhite ? 'text-white' : 'text-amber-700'} />;
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
              onClick={(e) => {
                // Prevent navigation if a nested button was clicked
                if ((e.target as HTMLElement).closest('button')) return;

                const typeMap: any = {
                  'notes': 'notes',
                  'layman': 'layman',
                  'example': 'real-life',
                  'code': 'code-example',
                  'deep-dive': 'technical-deep-dive',
                  'visual': 'notes'
                };
                window.location.href = `/start-learning/subtopic/notes?tab=${typeMap[card.type] || 'notes'}`;
              }}
              className="group flex min-w-0 flex-col rounded-3xl bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-6 min-h-[320px] cursor-pointer"
              style={{ 
                boxShadow: `0 20px 50px rgba(${brand.primaryRgb || '0,0,0'}, 0.05)`
              }}
            >
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                   <div 
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-inner"
                    style={{ backgroundColor: brand.primaryColor, color: '#ffffff' }}
                    aria-hidden="true"
                  >
                    {getIcon(card.type, true)}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h3 className="break-words text-lg font-bold leading-tight text-slate-950">
                      {card.title}
                    </h3>
                  </div>
                </div>
              </div>
              
              {isCode ? (
                <div className="flex flex-col flex-1">
                  <div className="relative overflow-hidden rounded-xl bg-[#0f172a] p-4 text-[13px] leading-relaxed text-slate-200 font-mono shadow-inner mb-4 border border-white/5">
                    <div className="absolute right-3 top-3 text-[10px] text-white uppercase font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded border border-white/10">JavaScript</div>
                    <pre className="hide-scrollbar overflow-x-auto whitespace-pre-wrap"><code>{card.code}</code></pre>
                  </div>
                   <div className="mt-auto flex items-center gap-3 pt-4">
                    <button 
                      onClick={() => {
                        const typeMap: any = { 'code': 'code-example' };
                        window.location.href = `/start-learning/subtopic/notes?tab=${typeMap[card.type] || 'notes'}`;
                      }}
                      className="min-w-0 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
                      style={{ backgroundColor: brand.primaryColor }}
                    >
                      <span className="flex items-center gap-1.5"><Play size={14} className="fill-white" aria-hidden="true" /> {card.ctaLabel}</span>
                    </button>
                    <button className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 hover:text-slate-950 transition-colors border border-slate-100">
                      <Copy size={14} aria-hidden="true" /> Copy
                    </button>
                  </div>
                </div>
              ) : card.type === 'visual' ? (
                <div className="flex flex-col flex-1">
                    <div className="relative mb-6 flex-1 overflow-hidden rounded-xl bg-green-50 flex items-center justify-center p-4 min-h-[120px] border border-green-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button aria-label="Play visual explanation" className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm cursor-pointer hover:bg-black/70 transition-all shadow-lg border border-white/20">
                          <Play size={20} className="fill-white ml-1" />
                        </button>
                      </div>
                      <div className="text-xs text-green-950 font-bold text-center z-0">{card.content}</div>
                    </div>
                  <div className="mt-auto flex items-center pt-4">
                    <button 
                      onClick={() => {
                        window.location.href = `/start-learning/subtopic/notes?tab=notes`;
                      }}
                      className="group flex items-center gap-1.5 text-xs font-bold transition-colors"
                      style={{ color: brand.primaryColor }}
                    >
                      {card.ctaLabel} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <p className="mb-6 flex-1 text-[13px] font-medium leading-relaxed text-slate-900 whitespace-pre-wrap">
                    {card.content}
                  </p>
                  <div className="mt-auto flex items-center pt-4">
                    <button 
                      onClick={() => {
                        const typeMap: any = {
                          'notes': 'notes',
                          'layman': 'layman',
                          'example': 'real-life',
                          'deep-dive': 'technical-deep-dive'
                        };
                        window.location.href = `/start-learning/subtopic/notes?tab=${typeMap[card.type] || 'notes'}`;
                      }}
                      className="group flex items-center gap-1.5 text-xs font-bold transition-colors"
                      style={{ color: '#c2410c' }} // Hardened Orange-700
                    >
                      {card.ctaLabel} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
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
              onClick={(e) => {
                // Prevent navigation if a nested button was clicked
                if ((e.target as HTMLElement).closest('button')) return;

                const typeMap: any = {
                  'assignment': 'assignments',
                  'project': 'project',
                  'quiz': 'quiz',
                  'practice': 'code-example'
                };
                window.location.href = `/start-learning/subtopic/notes?tab=${typeMap[task.type] || 'notes'}`;
              }}
              className="group flex min-w-0 flex-col rounded-3xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-6 min-h-[320px] cursor-pointer"
              style={{ 
                backgroundColor: bgColor,
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
                    <h3 className="break-words text-lg font-bold leading-tight text-white">
                      {task.title}
                    </h3>
                  </div>
                </div>
              </div>
              
              <div className="mb-6 flex-1 text-[13px] font-medium leading-relaxed text-white whitespace-pre-wrap">
                {task.content}
              </div>

              {task.badge && (
                <div className="mb-6 flex items-center gap-2">
                  <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-white flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" /> {task.badge.text}
                  </span>
                  {task.type === 'assignment' && (
                    <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      +50 XP
                    </span>
                  )}
                  {task.type === 'project' && (
                    <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      +150 XP
                    </span>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center pt-4">
                <button
                  className="w-full min-w-0 rounded-xl bg-white px-4 py-2.5 text-xs font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 border border-white/20"
                  style={{ color: bgColor }}
                >
                  <span className="flex items-center justify-center gap-1.5">{task.ctaLabel} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
