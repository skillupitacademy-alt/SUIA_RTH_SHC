'use client';

import React from 'react';
import { 
  FileText, Monitor, Youtube, Palette, BookOpen, 
  ClipboardList, Rocket, HelpCircle, Lightbulb, Globe, Pencil
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

  const getContentBgColor = (type: string) => {
    switch (type) {
      case 'notes': return '#C83700'; // Red-Orange (from image)
      case 'layman': return '#1051D8'; // Deep Blue (from image)
      case 'example': return '#2B69F0'; // Bright Blue (from image)
      case 'code': return '#5E4FE7'; // Purple/Indigo (from image)
      case 'deep-dive': return '#08A3C1'; // Teal/Cyan (from image)
      case 'visual': return '#7C3AED'; // Violet
      default: return brand.primaryColor;
    }
  };

  const getTaskBgColor = (type: string) => {
    switch (type) {
      case 'practice': return '#059669'; // Emerald
      case 'assignment': return '#D97706'; // Amber
      case 'project': return '#BE123C'; // Rose
      case 'quiz': return '#4338CA'; // Indigo
      default: return '#1e293b';
    }
  };

  const allCards = [...content, ...tasks];
  const isTaskCard = (type: string) => ['practice', 'assignment', 'project', 'quiz'].includes(type);

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="sr-only">Mastery Learning Path</h2>
      
      {/* Title Section */}
      <div className="mb-10 max-w-3xl space-y-3 text-center sm:mb-16">
        <h2 className="break-words text-2xl font-black tracking-tight text-[#0f172a] sm:text-3xl lg:text-4xl">
          Mastery Learning Roadmap
        </h2>
        <p className="mx-auto max-w-2xl text-sm font-bold leading-6 text-slate-500 sm:text-base lg:text-lg">
          Click each card to complete all 10 modules, master this topic, and earn up to 500 XP.
        </p>
      </div>

      {/* 10-Card Roadmap Grid */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-6">
        {allCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              let tab = 'notes';
              if (card.type === 'assignment') tab = 'assignments';
              else if (card.type === 'project') tab = 'project';
              else if (card.type === 'quiz') tab = 'quiz';
              else if (card.type === 'practice') tab = 'code-example';
              else if (card.type === 'layman') tab = 'layman';
              else if (card.type === 'example') tab = 'real-life';
              else if (card.type === 'code') tab = 'code-example';
              else if (card.type === 'deep-dive') tab = 'technical-deep-dive';
              window.location.href = `/start-learning/subtopic/notes?tab=${tab}`;
            }}
            className="group relative mx-auto flex aspect-square w-full max-w-[192px] min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[32px] border-t border-white/40 p-4 text-center shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] sm:p-5 xl:rounded-[40px]"
            style={{ backgroundColor: isTaskCard(card.type) ? getTaskBgColor(card.type) : getContentBgColor(card.type) }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            <div className="mb-2 flex h-10 w-10 items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <div className="scale-[1.25] text-white sm:scale-[1.4]">{getIcon(card.type, true)}</div>
            </div>
            <h3 className="mt-3 max-w-full break-words text-center text-[14px] font-black leading-tight tracking-wide text-white transition-all duration-300 sm:text-[15px]">
              {card.title}
            </h3>
            {isTaskCard(card.type) && (
              <div className="absolute right-4 top-4 rounded-full bg-black/20 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur-md">
                {card.type === 'assignment' ? '+50 XP' : card.type === 'project' ? '+150 XP' : 'Task'}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer Section */}
      <div className="mt-14 flex w-full min-w-0 flex-col items-center gap-6 sm:mt-20 sm:gap-8">
        <p className="text-center text-base font-bold text-slate-400">
          Backed by our Adaptive Learning Engine:
        </p>
        <div className="flex max-w-full flex-wrap justify-center gap-3 sm:gap-4">
          {[
            { label: '6-Block Content System', bg: 'bg-pink-50/50', text: 'text-pink-500', border: 'border-pink-100' },
            { label: 'Difficulty Progression', bg: 'bg-purple-50/50', text: 'text-purple-500', border: 'border-purple-100' },
            { label: `${brand.tutorLabel} Integration`, bg: 'bg-blue-50/50', text: 'text-blue-500', border: 'border-blue-100' },
            { label: 'Smart Remediation', bg: 'bg-indigo-50/50', text: 'text-indigo-500', border: 'border-indigo-100' }
          ].map((badge) => (
            <span 
              key={badge.label}
              className={`rounded-full border px-4 py-3 text-center text-xs font-black backdrop-blur-md shadow-2xl border-white/60 ${badge.bg} ${badge.text} ${badge.border} transition-all -translate-y-1 hover:-translate-y-3 sm:px-8`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
