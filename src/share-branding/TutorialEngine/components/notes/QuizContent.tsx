'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { submitQuizAnswer } from '../../../subtopicNotesDataAPI';

export function QuizContent({ 
  data, 
  onNext,
  currentQuestionIndex = 0,
  onQuestionChange,
  sectionId
}: { 
  data?: {
    title: string;
    description: string;
    totalQuestions: number;
    duration: string;
    xp: number;
    questions: Array<{
      id: string;
      questionNumber: number;
      type: string;
      points: number;
      question: string;
      code?: string;
      options: Array<{
        id: string;
        text: string;
      }>;
      correctAnswer: string;
      explanation: string;
    }>;
  };
  onNext?: () => void;
  currentQuestionIndex?: number;
  onQuestionChange?: (index: number) => void;
  sectionId?: string;
}) {
  const brand = useBrand();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Clear selected option when question changes
  React.useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestionIndex]);

  if (!data) return null;

  const { title, description, totalQuestions, duration, xp, questions } = data;
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    if (!sectionId) return;
    submitQuizAnswer('', sectionId, currentQuestion.id, optionId, currentQuestion.correctAnswer, 0).catch((error) => {
      console.error('[QuizContent] Failed to persist quiz answer:', error);
    });
  };

  return (
    <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:space-y-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{title}</h2>
          <p className="text-[14px] font-medium text-slate-800">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
           <div className="flex items-center gap-2 text-slate-800">
              <Icons.HelpCircle size={18} aria-hidden="true" />
              <span className="text-sm font-bold text-slate-900">{totalQuestions} Questions</span>
           </div>
           <div className="flex items-center gap-2 text-slate-800">
              <Icons.Clock size={18} aria-hidden="true" />
              <span className="text-sm font-bold text-slate-900">{duration}</span>
           </div>
           <div className="flex items-center gap-2 text-rose-900">
              <Icons.Trophy size={18} fill="currentColor" aria-hidden="true" />
              <span className="text-sm font-bold">+{xp} XP</span>
           </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">Your Progress</p>
            <p className="text-sm font-bold text-slate-950">{Math.round(progress)}%</p>
         </div>
         <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
               <span>Question {currentQuestion.questionNumber} of {totalQuestions}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
               <div className="h-full bg-gradient-to-r from-rose-400 to-pink-600 rounded-full" style={{ width: `${progress}%` }} />
            </div>
         </div>
      </div>

      {/* Question Card */}
      <section aria-label={`Quiz question ${currentQuestion.questionNumber} of ${totalQuestions}`} className="relative space-y-8 rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-10">
         <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
               <div className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-100">Q{currentQuestion.questionNumber}</div>
               <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                  <Icons.ListChecks size={14} aria-hidden="true" /> {currentQuestion.type}
               </div>
               <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                  <Icons.Star size={14} className="text-amber-900" fill="currentColor" aria-hidden="true" /> {currentQuestion.points} Points
               </div>
            </div>
            <button className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-slate-950 transition-colors" aria-label="Mark this question for later review">
               <Icons.Bookmark size={16} aria-hidden="true" /> Mark for Review
            </button>
         </div>

         <h3 className="text-xl font-bold text-slate-950 leading-tight">{currentQuestion.question}</h3>

         {/* Code Block */}
         {currentQuestion.code && (
           <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-4 font-mono text-[12px] leading-relaxed shadow-2xl sm:p-6 sm:text-sm">
              <div className="absolute top-0 right-0 p-2 opacity-20">
                 <Icons.Code size={40} className="text-slate-400" aria-hidden="true" />
              </div>
              <pre className="whitespace-pre-wrap break-words text-indigo-100">
                 {currentQuestion.code.split('\n').map((line, i) => (
                    <div key={i} className="flex min-w-0 gap-3 sm:gap-4">
                       <span className="w-4 text-slate-600 select-none">{i + 1}</span>
                       <span className="min-w-0 break-words">
                          {line.includes('//') ? <span className="text-emerald-300 italic">{line}</span> :
                           line.includes('Promise') || line.includes('Error') ? <span className="text-amber-300">{line}</span> :
                           line.includes('then') || line.includes('catch') ? <span className="text-pink-300">{line}</span> :
                           line}
                       </span>
                    </div>
                 ))}
              </pre>
           </div>
         )}

         {/* Options Grid */}
         <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((opt) => (
               <button
                  key={opt.id}
                  onClick={() => handleOptionSelect(opt.id)}
                   className={`group flex items-center gap-6 rounded-2xl p-6 transition-all border-t shadow-sm hover:shadow-xl hover:-translate-y-2 ${selectedOption === opt.id ? 'border-rose-500 bg-rose-50/50 ring-4 ring-rose-500/5 shadow-rose-100/50' : 'border-white/60 bg-white/40 hover:bg-white/80'}`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${selectedOption === opt.id ? 'border-rose-900 bg-rose-900' : 'border-slate-300 group-hover:border-slate-400'}`}>
                     {selectedOption === opt.id && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-sm font-semibold ${selectedOption === opt.id ? 'text-rose-950' : 'text-slate-900'}`}>
                     <span className="mr-4 text-[12px] opacity-70 font-bold">{opt.id}</span>
                     {opt.text}
                  </span>
               </button>
            ))}
         </div>

         {/* Explanation Box */}
         {selectedOption === currentQuestion.correctAnswer && (
            <div className="rounded-[24px] bg-rose-50/50 backdrop-blur-md p-8 flex items-start gap-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 border-t border-white/60">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm text-rose-600 relative z-10 border border-rose-100">
                  <Icons.Lightbulb size={24} aria-hidden="true" />
               </div>
               <div className="space-y-2 relative z-10">
                  <h4 className="text-sm font-bold text-rose-950">Explanation</h4>
                  <p className="text-[13px] text-rose-900 leading-relaxed">
                     {currentQuestion.explanation}
                  </p>
               </div>
               <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Icons.Zap size={100} className="text-rose-500" />
               </div>
            </div>
         )}
      </section>


    </div>
  );
}
