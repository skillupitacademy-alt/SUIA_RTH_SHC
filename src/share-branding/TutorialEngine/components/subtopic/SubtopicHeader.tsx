'use client';

import React from 'react';
import { Calendar, Clock, Bookmark, Star, Copy, CheckCircle2, Circle, Layers } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface SubtopicHeaderProps {
  data: {
    title: string;
    description: string;
    progress: number;
    progressLabel: string;
    metadata: {
      level: string;
      readingTime: string;
      xp: number;
      topicsCount: number;
      lastUpdated: string;
    };
  };
}

export function SubtopicHeader({ data }: SubtopicHeaderProps) {
  const brand = useBrand();

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Title & Meta Section */}
      <div className="flex flex-1 gap-5">
        {/* JS Icon */}
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[20px] bg-[#FFD600] text-3xl font-bold text-black shadow-md border border-black/5">
          JS
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">{data.title}</h1>
            <Bookmark size={20} className="text-slate-700" aria-hidden="true" />
          </div>
          <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-slate-900">
            {data.description}
          </p>

          <div className="flex flex-wrap items-center gap-5 pt-2 text-[13px] font-bold text-slate-800">
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
      <div className="w-full shrink-0 pt-6 md:w-[320px] md:pl-6 md:pt-0">
        <h2 className="mb-4 text-[15px] font-bold text-slate-950 uppercase tracking-widest">Overall Progress</h2>
        
        <div className="flex items-center gap-5">
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
          
          <div className="flex flex-col space-y-2 text-[13px] font-bold text-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-950 fill-emerald-50" aria-hidden="true" />
              Notes Completed
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-950 fill-emerald-50" aria-hidden="true" />
              Quiz Completed
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-950 fill-emerald-50" aria-hidden="true" />
              Assignment Done
            </div>
            <div className="flex items-center gap-2">
              <Circle size={16} className="text-orange-950 fill-orange-50" aria-hidden="true" />
              Project Pending
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
