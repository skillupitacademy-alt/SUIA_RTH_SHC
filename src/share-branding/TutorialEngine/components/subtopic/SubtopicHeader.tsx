'use client';

import React from 'react';
import { Calendar, Clock, GraduationCap, Layout, Star } from 'lucide-react';
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
    <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      {/* Title & Meta Section */}
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">{data.title}</h1>
          <p className="max-w-2xl text-lg font-medium text-gray-500 leading-relaxed">
            {data.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-gray-600">
            <GraduationCap size={16} className="text-slate-400" />
            {data.metadata.level}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-gray-600">
            <Clock size={16} className="text-slate-400" />
            {data.metadata.readingTime}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 border border-emerald-100">
            <Star size={16} className="fill-emerald-500" />
            {data.metadata.xp} XP
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-gray-600">
            <Layout size={16} className="text-slate-400" />
            {data.metadata.topicsCount} Topics
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-gray-600">
            <Calendar size={16} className="text-slate-400" />
            Updated {data.metadata.lastUpdated}
          </div>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="relative w-full overflow-hidden rounded-3xl bg-white p-6 shadow-2xl shadow-slate-200 md:w-72">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-24 w-24 items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="h-full w-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - data.progress / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ color: brand.primaryColor }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-gray-800">{data.progress}%</span>
            </div>
          </div>
          <h3 className="text-lg font-black text-gray-800">{data.progressLabel}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Completion Status</p>
        </div>
        
        {/* Background Decorative Element */}
        <div 
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-5 blur-3xl"
          style={{ backgroundColor: brand.primaryColor }}
        />
      </div>
    </div>
  );
}
