'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function AssignmentContent({ data, onNext }: { 
  data?: {
    title: string;
    description: string;
    xp: number;
    duration: string;
    task: {
      title: string;
      description: string;
      requirements: string[];
    };
    objectives: string[];
    starterCode: string;
    submissionGuidelines: string[];
  };
  onNext?: () => void;
}) {
  const brand = useBrand();

  // Use data from props or fallback to defaults
  const title = data?.title || 'Assignment';
  const description = data?.description || 'Apply concepts to a real-world task.';
  const xp = data?.xp || 150;
  const duration = data?.duration || '20 Mins';
  const task = data?.task || {
    title: 'Default Task',
    description: 'Complete the assignment.',
    requirements: ['Requirement 1', 'Requirement 2']
  };
  const objectives = data?.objectives || ['Objective 1', 'Objective 2'];
  
  // Ensure starterCode is always a string
  let starterCode = data?.starterCode || '// Starter code here';
  if (typeof starterCode !== 'string') {
    // If it's an object with a code property, extract it
    starterCode = (starterCode as any)?.code || '// Starter code here';
  }
  
  const submissionGuidelines = data?.submissionGuidelines || ['Submit your code', 'Test before submitting'];

  return (
    <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:space-y-12">
      
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{title}</h1>
          <p className="text-[14px] font-medium text-slate-800">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 border border-emerald-100 shadow-sm">
             <Icons.Zap size={16} className="text-emerald-600" />
             <span className="text-xs font-bold text-emerald-950">+{xp} XP</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-orange-50 px-4 py-2 border border-orange-100 shadow-sm">
             <Icons.Clock size={16} className="text-orange-600" />
             <span className="text-xs font-bold text-orange-950">{duration}</span>
          </div>
        </div>
      </div>

      {/* Task Description Card */}
      <section aria-label="Assignment task description" className="rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-10">
        <div className="space-y-8">
          <div className="flex min-w-0 items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-950 border border-orange-200">
                <Icons.Target size={22} aria-hidden="true" />
             </div>
             <h2 className="break-words text-xl font-bold text-slate-900">Task: {task.title}</h2>
          </div>
          <p className="text-[16px] font-medium leading-relaxed text-slate-800">
            {task.description}
          </p>
          <ul className="ml-0 space-y-4 sm:ml-6">
            {task.requirements.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] font-medium text-slate-800">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-900" />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Requirements */}
      <section aria-label="Assignment requirements" className="relative overflow-hidden rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-950 border border-indigo-200">
            <Icons.CheckCircle size={22} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Requirements</h2>
        </div>
        <ul className="space-y-5">
          {objectives.map((item, i) => (
            <li key={i} className="flex items-start gap-4 text-[14px] font-medium text-slate-700">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-950 border border-indigo-200">
                <Icons.Check size={14} strokeWidth={4} aria-hidden="true" />
              </div>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Starter Code */}
      <section aria-label="Assignment starter code" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-200">
                 <Icons.Code2 size={18} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Starter Code</h2>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[12px] font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all active:scale-95 border border-slate-200" aria-label="Copy starter code to clipboard">
             <Icons.Copy size={14} aria-hidden="true" /> Copy Code
          </button>
        </div>
        
        <div className="overflow-hidden rounded-[24px] bg-[#0f172a] shadow-2xl border-t border-white/10 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
          <div className="relative group min-h-[300px]">
             {/* Line Numbers */}
             <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900/50 border-r border-slate-800/50 flex flex-col items-center py-6 text-[12px] font-mono text-slate-400 select-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-6 leading-6">{i + 1}</div>
                ))}
             </div>
             {/* Code Content */}
             <div 
               className="min-w-0 py-6 pl-14 pr-4 font-mono text-[12px] leading-6 sm:pl-16 sm:text-[14px]"
               tabIndex={0}
               role="region"
               aria-label="Starter Code Editor"
             >
                <pre className="whitespace-pre-wrap break-words text-indigo-100">
                   {starterCode.split('\n').map((line, i) => (
                     <div key={i} className="min-h-6 whitespace-pre-wrap break-words">
                       {line.includes('//') ? <span className="text-emerald-300 italic">{line}</span> : 
                        line.includes('function') ? <span className="text-pink-300">function </span> :
                        line.includes('render') ? <span className="text-amber-300">{line}</span> :
                        line}
                     </div>
                   ))}
                </pre>
             </div>
          </div>
        </div>
      </section>

      {/* Submission Guidelines */}
      <section aria-label="Assignment submission guidelines" className="relative flex min-w-0 flex-col gap-8 rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
         <div className="space-y-6 relative z-10 lg:max-w-xl">
            <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-950 border border-sky-200">
                  <Icons.Info size={22} aria-hidden="true" />
               </div>
               <h2 className="text-xl font-bold text-slate-900">Submission Guidelines</h2>
            </div>
            <ul className="space-y-4">
               {submissionGuidelines.map((item, i) => (
                 <li key={i} className="flex items-start gap-3 text-[14px] font-medium text-slate-800">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-950" />
                    <span className="min-w-0 break-words">{item}</span>
                 </li>
               ))}
            </ul>
         </div>
         <div className="hidden lg:block relative">
            <div className="relative transform hover:scale-110 transition-transform duration-700">
               <img 
                 src="/submission_guidelines.svg" 
                 alt="Submission Guidelines Illustration" 
                 className="w-48 h-auto drop-shadow-2xl transition-transform duration-700 hover:scale-105"
               />
            </div>
         </div>
      </section>

    </div>
  );
}
