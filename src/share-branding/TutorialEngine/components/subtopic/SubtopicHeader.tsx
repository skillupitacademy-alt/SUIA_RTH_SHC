'use client';

import React from 'react';
import { Calendar, Clock, Bookmark, Star, CheckCircle2, Circle, Layers } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface SubtopicHeaderProps {
  data: {
    title: string;
    description: string;
    iconLabel?: string;
    progress: number;
    progressLabel: string;
    metadata: {
      level: string;
      readingTime: string;
      xp: number;
      topicsCount: number;
      lastUpdated: string;
    };
    checklist?: { label: string; completed: boolean }[];
  };
}

export function SubtopicHeader({ data }: SubtopicHeaderProps) {
  const brand = useBrand();
  const iconLabel = (data.iconLabel || data.title.match(/[A-Za-z0-9]+/g)?.slice(0, 2).map((word) => word[0]).join('') || 'RT').toUpperCase();
  const checklist = data.checklist && data.checklist.length > 0
    ? data.checklist.slice(0, 4)
    : [
        { label: 'Notes', completed: false },
        { label: 'Practice', completed: false },
        { label: 'Assignment', completed: false },
        { label: 'Quiz', completed: false },
      ];

  return (
    <div className="flex min-w-0 flex-col gap-6 rounded-2xl bg-white p-4 shadow-xl transition-all duration-300 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
      {/* Title & Meta Section */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-5">
        {/* Subtopic Icon */}
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[20px] bg-[#FFD600] text-3xl font-bold text-black shadow-md border border-black/5">
          {iconLabel.slice(0, 3)}
        </div>
        
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{data.title}</h1>
            <Bookmark size={20} className="mt-1 shrink-0 text-slate-700" aria-hidden="true" />
          </div>
          <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-slate-900">
            {data.description}
          </p>

          <div className="flex min-w-0 flex-wrap items-center gap-3 pt-2 text-[13px] font-bold text-slate-800 sm:gap-5">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-950 font-bold border border-emerald-200">
              <div className="h-2 w-2 rounded-full bg-emerald-700" aria-hidden="true" />
              {data.metadata.level}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-slate-800" aria-hidden="true" />
              {data.metadata.readingTime} read
            </div>
            <div className="flex items-center gap-1.5 font-bold" style={{ color: '#9a3412' }}>
              <Star size={16} fill="currentColor" aria-hidden="true" />
              {data.metadata.xp} XP
            </div>
            <div className="flex items-center gap-1.5 text-slate-950 font-bold">
              <Layers size={16} className="text-blue-900" aria-hidden="true" />
              {data.metadata.topicsCount} Topics
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-slate-800" aria-hidden="true" />
              Last updated: {data.metadata.lastUpdated.toLowerCase()}
            </div>
          </div>
        </div>
      </div>

       {/* Progress Summary Card */}
      <div className="w-full min-w-0 shrink-0 pt-6 lg:w-[320px] lg:pl-6 lg:pt-0">
        <h2 className="mb-4 break-words text-[15px] font-bold uppercase tracking-wider text-slate-950 sm:tracking-widest">Overall Progress</h2>
        
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full">
            <svg className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="36" cy="36" r="32" fill="none" strokeWidth="6" className="text-slate-100" stroke="currentColor" />
              <circle 
                cx="36" cy="36" r="32" fill="none" strokeWidth="6" stroke="currentColor" 
                strokeDasharray="201" 
                strokeDashoffset={201 - (201 * data.progress) / 100} 
                style={{ color: brand.primaryColor, strokeLinecap: 'round' }} 
              />
            </svg>
            <span className="text-xl font-bold text-slate-950">{data.progress}%</span>
          </div>
          
          <div className="flex min-w-0 flex-col space-y-2 text-[13px] font-bold text-slate-800">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.completed ? (
                  <CheckCircle2 size={16} className="text-emerald-950 fill-emerald-50" aria-hidden="true" />
                ) : (
                  <Circle size={16} className="text-orange-950 fill-orange-50" aria-hidden="true" />
                )}
                <span className="break-words">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
