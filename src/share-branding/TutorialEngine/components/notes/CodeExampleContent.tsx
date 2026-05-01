import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function CodeExampleContent({ onNext }: { onNext?: () => void }) {
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
            if (part.startsWith('//')) return <span key={j} className="text-emerald-500/60 italic">{part}</span>;
            if (part === 'const ' || part === 'return ') return <span key={j} className="text-pink-400">{part}</span>;
            if (part.startsWith('"') || part.startsWith("'")) return <span key={j} className="text-emerald-400">{part}</span>;
            if (/^\d+$/.test(part)) return <span key={j} className="text-rose-400">{part}</span>;
            return <span key={j} className="text-indigo-100">{part}</span>;
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
            <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">Code Example</h1>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600 border border-orange-200">Practical</span>
          </div>
          <p className="text-[15px] font-medium text-slate-500">See how Component Architecture works in real code. Try it, run it, and observe the output.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 border border-slate-200">
            <Icons.Bookmark size={16} /> Bookmark
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 border border-slate-200">
            <Icons.Share2 size={16} /> Share
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
              className={`pb-4 text-sm font-bold transition-all relative ${activeExample === i ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {ex.title}
              {activeExample === i && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="relative group">
           <button className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm border border-slate-200">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-400 text-[10px] font-black text-white">JS</span>
              JavaScript
              <Icons.ChevronDown size={14} className="text-slate-400" />
           </button>
        </div>
      </div>

      {/* Main Interactive Area */}
      <div className="space-y-4">
        {/* Editor Window */}
        <div className="rounded-[24px] overflow-hidden bg-[#0f172a] shadow-2xl border border-slate-200">
          <div className="flex items-center justify-between bg-[#1e293b]/50 px-6 py-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="text-[13px] font-mono font-bold text-slate-400">{examples[activeExample].file}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all active:scale-95">
                <Icons.Play size={14} fill="currentColor" /> Run Code
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-200">
                <Icons.Copy size={14} />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-200">
                <Icons.Download size={14} />
              </button>
            </div>
          </div>
          <div className="relative group min-h-[400px]">
             {/* Line Numbers */}
             <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900/50 border-r border-slate-800/50 flex flex-col items-center py-6 text-[12px] font-mono text-slate-600 select-none">
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
        </div>

        {/* Output Window */}
        <div className="rounded-[24px] overflow-hidden bg-[#0a0f1a] shadow-xl border border-slate-200">
           <div className="flex items-center justify-between bg-[#111827] px-6 py-3 border-b border-slate-900">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Output</span>
              <button className="text-[10px] font-black text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">Clear</button>
           </div>
           <div 
             className="p-6 font-mono text-[13px] leading-relaxed text-slate-300 overflow-y-auto max-h-[300px] hide-scrollbar"
             tabIndex={0}
             role="region"
             aria-label="Code Output Console"
           >
              <p className="flex items-center gap-3 text-slate-500 mb-2">
                 <Icons.Loader2 size={14} className="animate-spin" /> Running code...
              </p>
              <p className="flex items-center gap-3 text-emerald-400 font-bold mb-4">
                 <Icons.CheckCircle size={14} /> Success! Component rendered:
              </p>
              <div className="rounded-xl bg-slate-900/50 p-6 space-y-2 border border-slate-200">
                 <p>{`{`}</p>
                 <p className="ml-4">id: <span className="text-rose-400">101</span>,</p>
                 <p className="ml-4">name: <span className="text-emerald-400">'RealTutorialHub'</span>,</p>
                 <p className="ml-4">role: <span className="text-emerald-400">'Senior Developer'</span></p>
                 <p>{`}`}</p>
              </div>
              <p className="text-[11px] text-slate-600 mt-4 italic">(took 42ms)</p>
           </div>
        </div>

        {/* Try It Yourself Box */}
        <div className="rounded-[24px] bg-orange-50/20 p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-200">
           <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                 <Icons.Code size={24} />
              </div>
              <div>
                 <h4 className="text-lg font-black text-slate-800">Try It Yourself</h4>
                 <p className="text-[14px] font-medium text-slate-500">Edit the code above and click Run Code to see how it works.</p>
              </div>
           </div>
           <div className="rounded-2xl bg-white p-4 shadow-sm flex items-start gap-3 max-w-md border border-slate-200">
              <Icons.Lightbulb size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[12px] font-bold text-slate-600 leading-relaxed">
                 <span className="text-orange-600 uppercase tracking-tighter mr-1">Tip:</span> 
                 Change name = 'Your Name' on line 16 to see the component update in real-time.
              </p>
           </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between gap-4 pt-10">
        <button className="group flex flex-1 items-center gap-4 rounded-2xl bg-white p-4 shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-left border border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-white transition-colors">
            <Icons.ArrowLeft size={18} className="text-slate-400 group-hover:text-slate-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous</p>
            <p className="text-sm font-black text-slate-800">Technical Deep Dive</p>
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
