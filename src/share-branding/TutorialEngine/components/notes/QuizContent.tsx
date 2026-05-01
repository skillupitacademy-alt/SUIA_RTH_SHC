import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function QuizContent({ onNext }: { onNext?: () => void }) {
  const brand = useBrand();
  const [selectedOption, setSelectedOption] = useState('C');

  const codeSnippet = `Promise.resolve(1)
  .then(res => res + 1)
  .then(res => { throw new Error("Oops"); })
  .catch(err => console.log(err.message));`;

  const options = [
    { id: 'A', text: '1' },
    { id: 'B', text: '2' },
    { id: 'C', text: 'Oops' },
    { id: 'D', text: 'Error' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-700">
         <span>JavaScript</span> <Icons.ChevronRight size={10} aria-hidden="true" /> <span>React Development</span> <Icons.ChevronRight size={10} aria-hidden="true" /> <span>Component Architecture</span> <Icons.ChevronRight size={10} aria-hidden="true" /> <span className="text-slate-950">2.9 Quiz</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm">
                <Icons.FileText size={24} />
             </div>
              <div>
                 <div className="flex items-center gap-2">
                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-950 border border-rose-200">Quiz</span>
                    <h2 className="text-2xl font-bold text-slate-950 tracking-tight">2.9 Quiz: Component Architecture - Intermediate</h2>
                 </div>
                 <p className="text-[14px] font-medium text-slate-800">Test your understanding of component composition, props flow, and modular design patterns.</p>
              </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2 text-slate-800">
              <Icons.Layout size={18} aria-hidden="true" />
              <span className="text-sm font-bold text-slate-900">10 Questions</span>
           </div>
           <div className="flex items-center gap-2 text-slate-800">
              <Icons.Clock size={18} aria-hidden="true" />
              <span className="text-sm font-bold text-slate-900">15 min</span>
           </div>
           <div className="flex items-center gap-2 text-rose-900">
              <Icons.Trophy size={18} fill="currentColor" aria-hidden="true" />
              <span className="text-sm font-bold">+100 XP</span>
           </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">Your Progress</p>
            <p className="text-sm font-bold text-slate-950">40%</p>
         </div>
         <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
               <span>Question 4 of 10</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
               <div className="h-full bg-gradient-to-r from-rose-400 to-pink-600 rounded-full" style={{ width: '40%' }} />
            </div>
         </div>
      </div>

      {/* Question Card */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 relative group transition-all duration-300 hover:-translate-y-1">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-100">Q4</div>
               <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                  <Icons.ListChecks size={14} aria-hidden="true" /> Single Choice
               </div>
               <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                  <Icons.Star size={14} className="text-amber-900" fill="currentColor" aria-hidden="true" /> 2 Points
               </div>
            </div>
            <button className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-slate-950 transition-colors" aria-label="Mark this question for later review">
               <Icons.Bookmark size={16} aria-hidden="true" /> Mark for Review
            </button>
         </div>

         <h3 className="text-xl font-bold text-slate-950 leading-tight">What will be the output of the following code?</h3>

         {/* Code Block */}
         <div className="rounded-2xl bg-[#0f172a] p-6 font-mono text-sm leading-relaxed overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 p-2 opacity-20">
               <Icons.Code size={40} className="text-slate-400" aria-hidden="true" />
            </div>
            <pre className="text-indigo-100">
               {codeSnippet.split('\n').map((line, i) => (
                  <div key={i} className="flex gap-4">
                     <span className="w-4 text-slate-600 select-none">{i + 1}</span>
                     <span>
                        {line.includes('//') ? <span className="text-emerald-300 italic">{line}</span> :
                         line.includes('Promise') || line.includes('Error') ? <span className="text-amber-300">{line}</span> :
                         line.includes('then') || line.includes('catch') ? <span className="text-pink-300">{line}</span> :
                         line}
                     </span>
                  </div>
               ))}
            </pre>
         </div>

         {/* Options Grid */}
         <div className="grid grid-cols-1 gap-4">
            {options.map((opt) => (
               <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                   className={`group flex items-center gap-6 rounded-2xl p-6 transition-all border shadow-md hover:shadow-xl hover:-translate-y-0.5 ${selectedOption === opt.id ? 'border-rose-500 bg-rose-50/30 ring-4 ring-rose-500/5' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
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
         {selectedOption === 'C' && (
            <div className="rounded-[24px] bg-rose-50/50 p-8 flex items-start gap-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl transition-all duration-300 hover:shadow-2xl border border-rose-100">
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm text-rose-600 relative z-10 border border-rose-100">
                  <Icons.Lightbulb size={24} aria-hidden="true" />
               </div>
               <div className="space-y-2 relative z-10">
                  <h4 className="text-sm font-bold text-rose-950">Explanation</h4>
                  <p className="text-[13px] text-rose-900 leading-relaxed">
                     The first then() returns 2, then the second then() throws an error. 
                     The catch() block catches it and logs "Oops".
                  </p>
               </div>
               <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Icons.Zap size={100} className="text-rose-500" />
               </div>
            </div>
         )}
      </section>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4">
         <button className="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all border border-slate-200">
            <Icons.ArrowLeft size={18} aria-hidden="true" /> Previous
         </button>

         <button className="hidden sm:flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all border border-slate-200">
            <Icons.RotateCcw size={18} aria-hidden="true" /> Clear Answer
         </button>

        <button 
          onClick={onNext}
          className="group flex items-center gap-4 rounded-2xl px-10 py-4 shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-white" 
          style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
        >
          <span className="text-sm font-bold">Next Question</span>
          <Icons.ArrowRight size={18} />
        </button>
      </div>

      {/* Tip Footer */}
      <div className="flex items-center justify-between gap-4 pt-10 border-t border-slate-100">
         <div className="flex items-center gap-3 text-[12px] font-medium text-slate-800">
            <Icons.Zap size={16} className="text-amber-900" fill="currentColor" aria-hidden="true" />
            <p>Tip: Review the Promise Chain execution order in the <span className="text-slate-950 font-bold">Technical Deep Dive</span> section.</p>
         </div>
         <button className="flex items-center gap-2 text-[12px] font-bold text-rose-700 hover:text-rose-900 transition-colors uppercase tracking-widest">
            Go to Section <Icons.ArrowRight size={14} aria-hidden="true" />
         </button>
      </div>
    </div>
  );
}
