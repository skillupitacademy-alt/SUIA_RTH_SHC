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

  return (
    <div className="w-full">
      <h2 className="sr-only">Learning Path</h2>
      <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {allCards.map((card) => {
          const isTask = card.type === 'practice' || card.type === 'assignment' || card.type === 'project' || card.type === 'quiz';
          const bgColor = isTask ? getTaskBgColor(card.type) : getContentBgColor(card.type);
          
          return (
            <div 
              key={card.id}
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
              className="group relative flex aspect-square w-full max-w-[220px] mx-auto flex-col items-center justify-center rounded-[40px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.12)] transition-all duration-500 hover:scale-105 hover:shadow-[0_25px_60px_rgba(0,0,0,0.2)] cursor-pointer overflow-hidden border-b-[4px] border-black/10"
              style={{ backgroundColor: bgColor }}
            >
              {/* Matte Finish Gradient (Very subtle) */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              
              {/* Icon Container */}
              <div className="mb-3 flex h-14 w-14 items-center justify-center transition-transform duration-500 group-hover:scale-110">
                <div className="text-white scale-[1.8]">
                  {getIcon(card.type, true)}
                </div>
              </div>

              {/* Title */}
              <h3 className="mt-3 text-center text-lg font-black tracking-wide text-white transition-all duration-300">
                {card.title}
              </h3>

              {/* Status/Badge for Tasks */}
              {isTask && (
                <div className="absolute top-6 right-6 rounded-full bg-black/20 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur-md">
                  {card.type === 'assignment' ? '+50 XP' : card.type === 'project' ? '+150 XP' : 'Task'}
                </div>
              )}

              {/* Subtle Indicator */}
              <div className="absolute bottom-6 flex h-1.5 w-1.5 rounded-full bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-60" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
