'use client';

import React from 'react';
import { Trophy, Clock, Brain } from 'lucide-react';

interface QuizHeroProps {
  data: {
    quizTitle: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    estimatedTime: string;
    totalQuestions: number;
  };
  themeColor: string;
}

export function QuizHero({ data, themeColor }: QuizHeroProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] p-8 md:p-12 shadow-2xl">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 blur-[80px] translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Knowledge Check</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
              {data.quizTitle}
            </h2>
            <p className="text-lg text-slate-400 font-medium">
              {data.description}
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
              <Trophy size={20} className="text-yellow-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Reward</div>
              <div className="text-sm font-black text-white">Concept Badge</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-8 border-t border-slate-800/50">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-slate-500" />
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Duration</div>
              <div className="text-sm font-bold text-slate-300">{data.estimatedTime}</div>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden md:block" />

          <div className="flex items-center gap-3">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: data.difficulty === 'Beginner' ? '#10b981' : data.difficulty === 'Intermediate' ? '#f59e0b' : '#ef4444' }} 
            />
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Difficulty</div>
              <div className="text-sm font-bold text-slate-300">{data.difficulty}</div>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="text-sm font-black text-white bg-slate-800 px-2 py-1 rounded border border-slate-700">
              {data.totalQuestions}
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Challenges</div>
              <div className="text-sm font-bold text-slate-300">Questions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
