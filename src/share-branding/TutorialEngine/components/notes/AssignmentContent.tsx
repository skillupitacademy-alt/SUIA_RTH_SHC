import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function AssignmentContent({ onNext }: { onNext?: () => void }) {
  const brand = useBrand();

  const starterCode = `// Write your code here
function UserDashboard() {
  // 1. Create a Header component
  // 2. Create a Sidebar component
  // 3. Create a MainContent component
  // 4. Compose them into the UserDashboard
}

// Test your architecture
render(<UserDashboard />);`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">Assignment</h1>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600 border border-orange-200">Practical</span>
        </div>
        <p className="text-[15px] font-medium text-slate-500">Apply what you've learned about Component Architecture by solving this real-world problem.</p>
      </div>

      {/* Problem Statement */}
      <section className="rounded-[32px] bg-white p-10 shadow-sm relative overflow-hidden group border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Icons.ClipboardList size={22} />
          </div>
          <h2 className="text-xl font-black text-slate-800">Problem Statement</h2>
        </div>
        <div className="space-y-6">
          <p className="text-[15px] font-bold text-slate-600 leading-relaxed">
            Create a modular <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-100 font-mono">UserDashboard</span> component that assembles multiple sub-components. The architecture should:
          </p>
          <ul className="space-y-4 ml-6">
            {[
              'Contain a separate <Navbar /> component for branding.',
              'Contain a <Sidebar /> component for navigation links.',
              'Contain a <ProfileCard /> component to display user details.',
              'Compose all three into a single cohesive layout.'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-[14px] font-bold text-slate-500">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Requirements */}
      <section className="rounded-[32px] bg-white p-10 shadow-sm relative overflow-hidden group border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <Icons.CheckCircle size={22} />
          </div>
          <h2 className="text-xl font-black text-slate-800">Requirements</h2>
        </div>
        <ul className="space-y-5">
          {[
            'Use Functional Components for all parts.',
            'Props must be used to pass data to the ProfileCard.',
            'Each component must be self-contained.',
            'Maintain a clear parent-child relationship.',
            'Code must be clean and well-commented.'
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-[14px] font-bold text-slate-600">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-slate-200">
                <Icons.Check size={14} strokeWidth={4} />
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
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icons.Code2 size={18} />
             </div>
             <h2 className="text-lg font-black text-slate-800">Starter Code</h2>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[12px] font-black text-slate-600 shadow-sm hover:bg-gray-50 transition-all active:scale-95 border border-slate-200">
             <Icons.Copy size={14} /> Copy Code
          </button>
        </div>
        
        <div className="rounded-[24px] overflow-hidden bg-[#0f172a] shadow-2xl border border-slate-200">
          <div className="relative group min-h-[300px]">
             {/* Line Numbers */}
             <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900/50 border-r border-slate-800/50 flex flex-col items-center py-6 text-[12px] font-mono text-slate-600 select-none">
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
                       {line.includes('//') ? <span className="text-emerald-500/60 italic">{line}</span> : 
                        line.includes('function') ? <span className="text-pink-400">function </span> :
                        line.includes('render') ? <span className="text-amber-400">{line}</span> :
                        line}
                     </div>
                   ))}
                </pre>
             </div>
          </div>
        </div>
      </section>

      {/* Submission Guidelines */}
      <section className="rounded-[32px] bg-sky-50/30 p-10 flex items-center justify-between gap-10 relative overflow-hidden group border border-slate-200">
         <div className="space-y-6 relative z-10 lg:max-w-xl">
            <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <Icons.Info size={22} />
               </div>
               <h2 className="text-xl font-black text-slate-800">Submission Guidelines</h2>
            </div>
            <ul className="space-y-4">
               {[
                 'Submit only the component architecture code.',
                 'Do not modify the render call at the bottom.',
                 'Test your code structure before submitting.'
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-[14px] font-bold text-slate-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
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

      {/* Footer Navigation */}
      <div className="flex items-center justify-between gap-4 pt-10">
        <button className="group flex flex-1 items-center gap-4 rounded-2xl bg-white p-4 shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-left border border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-white transition-colors">
            <Icons.ArrowLeft size={18} className="text-slate-400 group-hover:text-slate-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous</p>
            <p className="text-sm font-black text-slate-800">Code Example</p>
          </div>
        </button>

        <button className="hidden sm:flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-95 border border-slate-200">
           <Icons.LayoutGrid size={18} aria-hidden="true" /> Back to Subtopic
        </button>

        <button 
          onClick={onNext}
          className="group flex flex-1 items-center justify-between gap-4 rounded-2xl p-4 shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-left text-white" 
          style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
        >
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Next</p>
            <p className="text-sm font-black">AI Tutor</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Icons.ArrowRight size={18} aria-hidden="true" />
          </div>
        </button>
      </div>
    </div>
  );
}
