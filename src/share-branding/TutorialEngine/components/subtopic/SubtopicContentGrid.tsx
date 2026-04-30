'use client';

import React from 'react';
import * as Icons from 'lucide-react';
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
      case 'notes': return <Icons.FileText size={20} />;
      case 'layman': return <Icons.User size={20} />;
      case 'example': return <Icons.Lightbulb size={20} />;
      case 'code': return <Icons.Code2 size={20} />;
      case 'deep-dive': return <Icons.Zap size={20} />;
      case 'visual': return <Icons.Image size={20} />;
      case 'task': return <Icons.CheckSquare size={20} />;
      default: return <Icons.BookOpen size={20} />;
    }
  };

  return (
    <div className="space-y-12">
      {/* Learning Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {content.map((card) => (
          <div 
            key={card.id}
            className="group relative flex flex-col rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 border border-gray-100 transition-all hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors group-hover:bg-primary group-hover:text-white"
                style={{ backgroundColor: `${brand.primaryColor}10`, color: brand.primaryColor }}
              >
                {getIcon(card.type)}
              </div>
              {card.badge && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                  card.badge.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  card.badge.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                  'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {card.badge.text}
                </span>
              )}
            </div>

            <h3 className="mb-3 text-lg font-black text-gray-800">{card.title}</h3>
            
            {card.code ? (
              <pre className="mb-4 flex-1 overflow-x-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-300 hide-scrollbar font-mono">
                <code>{card.code}</code>
              </pre>
            ) : (
              <p className="mb-6 flex-1 text-sm font-medium text-gray-500 leading-relaxed line-clamp-4">
                {card.content}
              </p>
            )}

            <button 
              className="mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all bg-slate-50 text-gray-600 hover:bg-slate-100"
            >
              {card.ctaLabel}
              <Icons.ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Interactive Tasks Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-gray-900">Practical Applications</h2>
          <div className="h-px flex-1 bg-gray-100"></div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className="flex items-center gap-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-100 border border-gray-100 transition-all hover:border-primary/20"
            >
              <div 
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${brand.primaryColor}05` }}
              >
                <div 
                  className="animate-float"
                  style={{ color: brand.primaryColor }}
                >
                  {getIcon(task.type)}
                </div>
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-gray-800">{task.title}</h4>
                  {task.badge && (
                    <span className="text-[10px] font-black text-primary uppercase" style={{ color: brand.primaryColor }}>
                      • {task.badge.text}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-500 line-clamp-2">{task.content}</p>
              </div>

              <button 
                className="rounded-xl px-4 py-2 text-xs font-black text-white transition-all shadow-lg active:scale-95"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {task.ctaLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
