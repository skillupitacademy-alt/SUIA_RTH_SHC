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
      <div className="mb-16 text-center space-y-3">
        <h2 className="text-4xl font-black tracking-tight text-[#0f172a]">
          Mastery Learning Roadmap
        </h2>
        <p className="text-lg font-bold text-slate-500 max-w-2xl mx-auto">
          Click each card to complete all 10 modules, master this topic, and earn up to 500 XP.
        </p>
      </div>

      {/* 10-Card Roadmap Grid with Arrows */}
      <div className="w-full space-y-24 px-12">
        {/* Row 1: First 5 Cards */}
        <div className="flex w-full items-center justify-between">
          {allCards.slice(0, 5).map((card, index) => (
            <React.Fragment key={card.id}>
              <div 
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
                className="group relative flex h-[192px] w-[192px] flex-shrink-0 flex-col items-center justify-center rounded-[44px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:scale-105 hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)] cursor-pointer overflow-hidden border-b-[4px] border-black/10"
                style={{ backgroundColor: isTaskCard(card.type) ? getTaskBgColor(card.type) : getContentBgColor(card.type) }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                <div className="mb-2 flex h-10 w-10 items-center justify-center transition-transform duration-500 group-hover:scale-110">
                  <div className="text-white scale-[1.4]">{getIcon(card.type, true)}</div>
                </div>
                <h3 className="mt-3 text-center text-[15px] font-black tracking-wide text-white transition-all duration-300">
                  {card.title}
                </h3>
                {isTaskCard(card.type) && (
                  <div className="absolute top-5 right-5 rounded-full bg-black/20 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur-md">
                    {card.type === 'assignment' ? '+50 XP' : card.type === 'project' ? '+150 XP' : 'Task'}
                  </div>
                )}
              </div>
              {index < 4 && (
                <ArrowRight size={32} className="text-violet-300 flex-shrink-0 mx-4 opacity-50" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Row 2: Next 5 Cards */}
        <div className="flex w-full items-center justify-between">
          {allCards.slice(5, 10).map((card, index) => (
            <React.Fragment key={card.id}>
              <div 
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
                className="group relative flex h-[192px] w-[192px] flex-shrink-0 flex-col items-center justify-center rounded-[44px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:scale-105 hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)] cursor-pointer overflow-hidden border-b-[4px] border-black/10"
                style={{ backgroundColor: isTaskCard(card.type) ? getTaskBgColor(card.type) : getContentBgColor(card.type) }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                <div className="mb-2 flex h-10 w-10 items-center justify-center transition-transform duration-500 group-hover:scale-110">
                  <div className="text-white scale-[1.4]">{getIcon(card.type, true)}</div>
                </div>
                <h3 className="mt-3 text-center text-[15px] font-black tracking-wide text-white transition-all duration-300">
                  {card.title}
                </h3>
                {isTaskCard(card.type) && (
                  <div className="absolute top-5 right-5 rounded-full bg-black/20 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur-md">
                    {card.type === 'assignment' ? '+50 XP' : card.type === 'project' ? '+150 XP' : 'Task'}
                  </div>
                )}
              </div>
              {index < 4 && (
                <ArrowRight size={32} className="text-violet-300 flex-shrink-0 mx-4 opacity-50" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-20 flex flex-col items-center gap-8">
        <p className="text-base font-bold text-slate-400">
          Backed by our Adaptive Learning Engine:
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { label: '6-Block Content System', bg: 'bg-pink-50/50', text: 'text-pink-500', border: 'border-pink-100' },
            { label: 'Difficulty Progression', bg: 'bg-purple-50/50', text: 'text-purple-500', border: 'border-purple-100' },
            { label: 'AI Tutor Integration', bg: 'bg-blue-50/50', text: 'text-blue-500', border: 'border-blue-100' },
            { label: 'Smart Remediation', bg: 'bg-indigo-50/50', text: 'text-indigo-500', border: 'border-indigo-100' }
          ].map((badge) => (
            <span 
              key={badge.label}
              className={`px-8 py-3 rounded-full text-xs font-black border ${badge.bg} ${badge.text} ${badge.border} shadow-sm transition-all hover:scale-105`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
