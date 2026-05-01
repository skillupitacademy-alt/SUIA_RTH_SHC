'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function AssignmentContent({ onNext }: { onNext?: () => void }) {
  const brand = useBrand();

  const starterCode = `// 1. Define your components
function Navbar() { return <div>Navbar</div>; }
function Sidebar() { return <div>Sidebar</div>; }
function ProfileCard({ user }) { 
  return <div>{user.name}</div>; 
}

// 2. Compose them
function App() {
  const user = { name: "John Doe" };
  return (
    <div>
      <Navbar />
      <Sidebar />
      <ProfileCard user={user} />
    </div>
  );
}

render(<App />);`;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-slate-950 tracking-tight">Assignment</h1>
          <p className="text-[14px] font-medium text-slate-800">Apply Component Architecture to a real-world task.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 border border-emerald-100 shadow-sm">
             <Icons.Zap size={16} className="text-emerald-600" />
             <span className="text-xs font-bold text-emerald-950">+150 XP</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-orange-50 px-4 py-2 border border-orange-100 shadow-sm">
             <Icons.Clock size={16} className="text-orange-600" />
             <span className="text-xs font-bold text-orange-950">20 Mins</span>
          </div>
        </div>
      </div>

      {/* Task Description Card */}
      <section className="rounded-[40px] bg-[#fffbf9] p-10 shadow-xl border border-orange-100 transition-all duration-300 hover:-translate-y-1">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-950 border border-orange-200">
                <Icons.Target size={22} aria-hidden="true" />
             </div>
             <h2 className="text-xl font-bold text-slate-900">Task: Profile Dashboard Composition</h2>
          </div>
          <p className="text-[16px] font-medium leading-relaxed text-slate-800">
            Your task is to refactor a monolithic dashboard into three clean, reusable components. The final result should:
          </p>
          <ul className="space-y-4 ml-6">
            {[
              'Contain a separate <Navbar /> component for branding.',
              'Contain a <Sidebar /> component for navigation links.',
              'Contain a <ProfileCard /> component to display user details.',
              'Compose all three into a single cohesive layout.'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-[14px] font-medium text-slate-800">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-900" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Requirements */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-950 border border-indigo-200">
            <Icons.CheckCircle size={22} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Requirements</h2>
        </div>
        <ul className="space-y-5">
          {[
            'Use Functional Components for all parts.',
            'Props must be used to pass data to the ProfileCard.',
            'Each component must be self-contained.',
            'Maintain a clear parent-child relationship.',
            'Code must be clean and well-commented.'
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-[14px] font-medium text-slate-700">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-950 border border-indigo-200">
                <Icons.Check size={14} strokeWidth={4} aria-hidden="true" />
              </div>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Starter Code */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-200">
                 <Icons.Code2 size={18} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Starter Code</h2>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[12px] font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all active:scale-95 border border-slate-200" aria-label="Copy starter code to clipboard">
             <Icons.Copy size={14} aria-hidden="true" /> Copy Code
          </button>
        </div>
        
        <div className="rounded-[24px] overflow-hidden bg-[#0f172a] shadow-2xl border border-slate-200">
          <div className="relative group min-h-[300px]">
             {/* Line Numbers */}
             <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900/50 border-r border-slate-800/50 flex flex-col items-center py-6 text-[12px] font-mono text-slate-400 select-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-6 leading-6">{i + 1}</div>
                ))}
             </div>
             {/* Code Content */}
             <div 
               className="pl-16 py-6 font-mono text-[14px] leading-6 overflow-auto hide-scrollbar"
               tabIndex={0}
               role="region"
               aria-label="Starter Code Editor"
             >
                <pre className="text-indigo-100">
                   {starterCode.split('\n').map((line, i) => (
                     <div key={i} className="h-6 whitespace-pre">
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
      <section className="rounded-[32px] bg-sky-50/30 p-10 flex items-center justify-between gap-10 relative overflow-hidden group shadow-xl transition-all duration-300 hover:-translate-y-1">
         <div className="space-y-6 relative z-10 lg:max-w-xl">
            <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-950 border border-sky-200">
                  <Icons.Info size={22} aria-hidden="true" />
               </div>
               <h2 className="text-xl font-bold text-slate-900">Submission Guidelines</h2>
            </div>
            <ul className="space-y-4">
               {[
                 'Submit only the component architecture code.',
                 'Do not modify the render call at the bottom.',
                 'Test your code structure before submitting.'
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-[14px] font-medium text-slate-800">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-950" />
                    {item}
                 </li>
               ))}
            </ul>
         </div>
         <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-sky-500/10 blur-3xl rounded-full" />
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
