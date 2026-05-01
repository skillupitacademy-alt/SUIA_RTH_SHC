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
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Title & Meta Section */}
      <div className="flex flex-1 gap-5">
        {/* JS Icon */}
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[20px] bg-[#FFD600] text-3xl font-black text-black shadow-sm">
          JS
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#1e293b]">{data.title}</h1>
            <Bookmark size={20} className="text-gray-400" />
          </div>
          <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-gray-500">
            {data.description}
          </p>

          <div className="flex flex-wrap items-center gap-5 pt-2 text-[13px] font-bold text-gray-500">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              {data.metadata.level}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-gray-400" />
              {data.metadata.readingTime} read
            </div>
            <div className="flex items-center gap-1.5" style={{ color: brand.primaryColor }}>
              <Star size={16} fill="currentColor" />
              {data.metadata.xp} XP
            </div>
            <div className="flex items-center gap-1.5 text-[#1e293b]">
              <Layers size={16} className="text-[#3b82f6]" />
              {data.metadata.topicsCount} Topics
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-gray-400" />
              Last updated: {data.metadata.lastUpdated.toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="w-full shrink-0 border-t border-gray-100 pt-6 md:w-[320px] md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <h2 className="mb-4 text-[15px] font-black text-[#1e293b]">Overall Progress</h2>
        
        <div className="flex items-center gap-5">
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full">
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="36" cy="36" r="32" fill="none" strokeWidth="6" className="text-gray-100" stroke="currentColor" />
              <circle 
                cx="36" cy="36" r="32" fill="none" strokeWidth="6" stroke="currentColor" 
                strokeDasharray="201" 
                strokeDashoffset={201 - (201 * data.progress) / 100} 
                style={{ color: brand.primaryColor, strokeLinecap: 'round' }} 
              />
            </svg>
            <span className="text-xl font-black text-gray-800">{data.progress}%</span>
          </div>
          
          <div className="flex flex-col space-y-2 text-[13px] font-medium text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50" />
              Notes Completed
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50" />
              Quiz Completed
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50" />
              Assignment Done
            </div>
            <div className="flex items-center gap-2">
              <Circle size={16} className="text-yellow-500 fill-yellow-50" />
              Project Pending
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
