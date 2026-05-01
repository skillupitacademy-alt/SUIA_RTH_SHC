'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function CodeExampleContent() {
  const brand = useBrand();
  const [activeExample, setActiveExample] = useState(0);

  const examples = [
    { title: 'Example 1: Basic Component', file: 'user-profile.tsx' },
    { title: 'Example 2: State & Lifecycle', file: 'counter.tsx' },
    { title: 'Example 3: Composition', file: 'app-layout.tsx' }
  ];

  const code = `// 1. Defining a Functional Component
const UserProfile = ({ name, role }) => {
  return (
    <div className="profile-card">
      <h2>{name}</h2>
      <p>{role}</p>
    </div>
  );
};

// 2. Using the Component with Props
const App = () => {
  return (
    <div className="container">
      <h1>Team Members</h1>
      <UserProfile 
        name="RealTutorialHub" 
        role="Senior Developer" 
      />
    </div>
  );
};

console.log("✅ Component rendered successfully!");`;

  const renderCode = (codeText: string) => {
    return codeText.split('\n').map((line, i) => {
      // Very basic highlighter for demonstration
      const parts = line.split(/(\/\/.*|const |return |".*?"|'.*?'|`.*?`|\d+)/g);
      return (
        <div key={i} className="h-6 whitespace-pre">
          {parts.map((part, j) => {
            if (part.startsWith('//')) return <span key={j} className="text-slate-300 italic">{part}</span>;
            if (part === 'const ' || part === 'return ') return <span key={j} className="text-pink-300 font-bold">{part}</span>;
            if (part.startsWith('"') || part.startsWith("'")) return <span key={j} className="text-emerald-300 font-bold">{part}</span>;
            if (/^\d+$/.test(part)) return <span key={j} className="text-rose-300 font-bold">{part}</span>;
            return <span key={j} className="text-indigo-50">{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-slate-950 tracking-tight">Code Example</h1>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-950 border border-orange-200">Practical</span>
          </div>
          <p className="text-[15px] font-medium text-slate-800">See how Component Architecture works in real code. Try it, run it, and observe the output.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-95 border border-slate-200" aria-label="Bookmark this code example">
            <Icons.Bookmark size={16} aria-hidden="true" /> Bookmark
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-95 border border-slate-200" aria-label="Share this code example">
            <Icons.Share2 size={16} aria-hidden="true" /> Share
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-2">
        <div className="flex items-center gap-8">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setActiveExample(i)}
              className={`pb-4 text-sm font-bold transition-all relative ${activeExample === i ? 'text-orange-900' : 'text-slate-700 hover:text-slate-950'}`}
            >
              {ex.title}
              {activeExample === i && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-800 rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="relative group">
            <button className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm border border-slate-200" aria-label="Select Programming Language">
               <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-600 text-[10px] font-bold text-slate-950" aria-hidden="true">JS</span>
               JavaScript
               <Icons.ChevronDown size={14} className="text-slate-700" aria-hidden="true" />
            </button>
        </div>
      </div>

      {/* Main Interactive Area */}
      <div className="space-y-4">
        {/* Editor Window */}
        <section className="flex flex-col overflow-hidden rounded-[32px] bg-[#1e293b] shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between bg-[#1e293b]/50 px-6 py-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" aria-hidden="true" />
              <span className="text-[13px] font-mono font-bold text-slate-200">{examples[activeExample].file}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-orange-800 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-900 transition-all active:scale-95">
                <Icons.Play size={14} fill="currentColor" aria-hidden="true" /> Run Code
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:text-white transition-colors" aria-label="Copy code to clipboard">
                <Icons.Copy size={14} aria-hidden="true" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:text-white transition-colors" aria-label="Download code file">
                <Icons.Download size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="relative group min-h-[400px]">
             {/* Line Numbers */}
             <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#020617] border-r border-slate-800/50 flex flex-col items-center py-6 text-[12px] font-mono text-slate-400 select-none">
                {Array.from({ length: 24 }).map((_, i) => (
                   <div key={i} className="h-6 leading-6">{i + 1}</div>
                ))}
             </div>
             {/* Code Content */}
             <div 
               className="pl-16 py-6 font-mono text-[14px] leading-6 overflow-auto hide-scrollbar"
               tabIndex={0}
               role="region"
               aria-label="Code Editor Content"
             >
                <pre>
                   {renderCode(code)}
                </pre>
             </div>
             {/* Minimap Placeholder */}
             <div className="absolute right-4 top-8 w-16 h-32 bg-slate-800/20 rounded border border-slate-700/30 overflow-hidden pointer-events-none hidden lg:block opacity-40">
                <div className="w-full h-2 bg-emerald-500/20 mb-1" />
                <div className="w-full h-4 bg-pink-500/20 mb-1" />
                <div className="w-2/3 h-2 bg-indigo-500/20 mb-1" />
                <div className="w-full h-2 bg-orange-500/20 mb-1" />
             </div>
          </div>
        </section>

        {/* Output Window */}
        <div className="rounded-[24px] overflow-hidden bg-[#0a0f1a] shadow-xl transition-all duration-300 hover:-translate-y-1">
           <div className="flex items-center justify-between bg-[#111827] px-6 py-3">
              <h2 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">Output</h2>
              <button className="text-[10px] font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest">Clear Console</button>
           </div>
           <div 
             className="p-6 font-mono text-[13px] leading-relaxed text-slate-300 overflow-y-auto max-h-[300px] hide-scrollbar"
             tabIndex={0}
             role="region"
             aria-label="Code Output Console"
           >
              <p className="flex items-center gap-3 text-slate-300 mb-2">
                 <Icons.Loader2 size={14} className="animate-spin" aria-hidden="true" /> Running code...
              </p>
              <p className="flex items-center gap-3 text-emerald-400 font-bold mb-4">
                 <Icons.CheckCircle size={14} aria-hidden="true" /> Success! Component rendered:
              </p>
              <div className="rounded-xl bg-slate-900/50 p-6 space-y-2">
                 <p>{`{`}</p>
                 <p className="ml-4">id: <span className="text-rose-400">101</span>,</p>
                 <p className="ml-4">name: <span className="text-emerald-400">'RealTutorialHub'</span>,</p>
                 <p className="ml-4">role: <span className="text-emerald-400">'Senior Developer'</span></p>
                 <p>{`}`}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 italic font-bold">(took 42ms)</p>
           </div>
        </div>

        {/* Try It Yourself Box */}
        <section className="rounded-[32px] bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-950 border border-orange-200">
                  <Icons.Code size={24} aria-hidden="true" />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-slate-900">Try It Yourself</h2>
                  <p className="text-[14px] font-medium text-slate-800">Edit the code above and click Run Code to see how it works.</p>
               </div>
            </div>
             <div className="rounded-2xl bg-slate-50 p-4 shadow-sm flex items-start gap-3 max-w-md border border-slate-200">
               <Icons.Lightbulb size={18} className="text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[12px] font-bold text-slate-900 leading-relaxed">
                  <span className="text-amber-800 uppercase tracking-tighter mr-1 font-bold">Tip:</span> 
                  Change name = 'Your Name' on line 16 to see the component update in real-time.
                </p>
            </div>
        </section>
      </div>

    </div>
  );
}
