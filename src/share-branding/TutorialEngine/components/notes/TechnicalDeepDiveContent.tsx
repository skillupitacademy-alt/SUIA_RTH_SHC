'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function TechnicalDeepDiveContent({ data }: { data?: SubtopicNotesViewData['mainContent']['technicalDeepDive'] }) {
  const brand = useBrand();
  if (!data) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-700">
             <span>JavaScript</span> <Icons.ChevronRight size={10} aria-hidden="true" /> <span>Components</span> <Icons.ChevronRight size={10} aria-hidden="true" /> <span className="text-slate-950">Technical Deep Dive</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-[#1e293b] tracking-tight">{data.title}</h1>
            <div 
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {data.badge}
            </div>
          </div>
          <p className="text-[14px] font-medium text-slate-800">{data.intro}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95" aria-label="Bookmark this technical deep dive">
            <Icons.Bookmark size={16} aria-hidden="true" /> Bookmark
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95" aria-label="Share this technical deep dive">
            <Icons.Share2 size={16} aria-hidden="true" /> Share
          </button>
        </div>
      </div>

      {/* 0. Intro Section */}
      <section className="rounded-[40px] bg-[#fffbf9] p-10 shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
           <div className="space-y-8">
              <h2 className="text-3xl font-bold text-slate-950 tracking-tight">What is a Component?</h2>
              <p className="text-[16px] font-medium leading-relaxed text-slate-800">
                A <strong>Component</strong> is a self-contained unit of UI that manages its own logic and appearance. It represents a piece of the eventual full page.
              </p>
               <div className="flex items-center gap-6 py-2">
                   <div className="flex flex-col items-center gap-2">
                     <div className="rounded-[18px] bg-orange-100 px-6 py-3 text-sm font-bold text-orange-950 shadow-sm border border-orange-200">Pending</div>
                     <span className="text-[12px] text-slate-800 font-bold">Mounting / Loading</span>
                   </div>
                  <Icons.ArrowRight size={18} className="text-slate-900 mt-[-25px]" aria-hidden="true" />
                   <div className="flex flex-col items-center gap-2">
                     <div className="rounded-[18px] bg-emerald-100 px-6 py-3 text-sm font-bold text-emerald-950 shadow-sm border border-emerald-200">Fulfilled</div>
                     <span className="text-[12px] text-slate-800 font-bold text-center">Rendered /<br/>Active UI</span>
                   </div>
                  <Icons.ArrowRight size={18} className="text-slate-900 mt-[-25px]" aria-hidden="true" />
                   <div className="flex flex-col items-center gap-2">
                     <div className="rounded-[18px] bg-rose-100 px-6 py-3 text-sm font-bold text-rose-950 shadow-sm border border-rose-200">Rejected</div>
                     <span className="text-[12px] text-slate-800 font-bold text-center">Error /<br/>Fallback</span>
                   </div>
               </div>
           </div>
           <div className="rounded-[32px] overflow-hidden bg-[#0f172a] shadow-2xl relative h-[300px]">
              <div 
                className="p-8 font-mono text-[13px] leading-relaxed overflow-auto h-full hide-scrollbar text-indigo-100"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                tabIndex={0}
                role="region"
                aria-label="Component Lifecycle Mapping Code"
              >
                 <p className="text-slate-400 mb-2">{`{/* Component Lifecycle Mapping */}`}</p>
                 <p className="text-indigo-100">{`<`}<span className="text-pink-400">div</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"flex items-center gap-6 py-2"</span>{`>`}</p>
                 
                 {/* Pending */}
                 <p className="ml-4 text-indigo-100">{`<`}<span className="text-pink-400">div</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"flex flex-col items-center gap-2"</span>{`>`}</p>
                 <p className="ml-8 text-indigo-100">{`<`}<span className="text-pink-400">div</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"..."</span>{`>`}Pending{`</`}<span className="text-pink-400">div</span>{`>`}</p>
                 <p className="ml-8 text-indigo-100">{`<`}<span className="text-pink-400">span</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"..."</span>{`>`}Mounting / Loading{`</`}<span className="text-pink-400">span</span>{`>`}</p>
                 <p className="ml-4 text-indigo-100">{`</`}<span className="text-pink-400">div</span>{`>`}</p>
                 
                 <p className="ml-4 text-indigo-100">{`<`}<span className="text-indigo-300">Icons.ArrowRight</span> <span className="text-orange-300">size</span>={`{`}<span className="text-orange-300">18</span>{`}`} <span className="text-orange-300">className</span>=<span className="text-emerald-400">"..."</span> {`/>`}</p>
                 
                 {/* Fulfilled */}
                 <p className="ml-4 text-indigo-100">{`<`}<span className="text-pink-400">div</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"flex flex-col items-center gap-2"</span>{`>`}</p>
                 <p className="ml-8 text-indigo-100">{`<`}<span className="text-pink-400">div</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"..."</span>{`>`}Fulfilled{`</`}<span className="text-pink-400">div</span>{`>`}</p>
                 <p className="ml-8 text-indigo-100">{`<`}<span className="text-pink-400">span</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"..."</span>{`>`}Rendered / Active UI{`</`}<span className="text-pink-400">span</span>{`>`}</p>
                 <p className="ml-4 text-indigo-100">{`</`}<span className="text-pink-400">div</span>{`>`}</p>
                 
                 <p className="ml-4 text-indigo-100">{`<`}<span className="text-indigo-300">Icons.ArrowRight</span> <span className="text-orange-300">size</span>={`{`}<span className="text-orange-300">18</span>{`}`} <span className="text-orange-300">className</span>=<span className="text-emerald-400">"..."</span> {`/>`}</p>
                 
                 {/* Rejected */}
                 <p className="ml-4 text-indigo-100">{`<`}<span className="text-pink-400">div</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"flex flex-col items-center gap-2"</span>{`>`}</p>
                 <p className="ml-8 text-indigo-100">{`<`}<span className="text-pink-400">div</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"..."</span>{`>`}Rejected{`</`}<span className="text-pink-400">div</span>{`>`}</p>
                 <p className="ml-8 text-indigo-100">{`<`}<span className="text-pink-400">span</span> <span className="text-orange-300">className</span>=<span className="text-emerald-400">"..."</span>{`>`}Error / Fallback{`</`}<span className="text-pink-400">span</span>{`>`}</p>
                 <p className="ml-4 text-indigo-100">{`</`}<span className="text-pink-400">div</span>{`>`}</p>
                 
                 <p className="text-indigo-100">{`</`}<span className="text-pink-400">div</span>{`>`}</p>
              </div>
              <div className="absolute bottom-6 right-6 flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">JSX</span>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors shadow-lg" aria-label="Copy code">
                     <Icons.Copy size={16} aria-hidden="true" />
                  </button>
               </div>
           </div>
        </div>
      </section>

      {/* 1. Component Anatomy */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>1</div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">1. Component Anatomy</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Box: Internal Structure */}
          <div className="lg:col-span-7 rounded-[24px] bg-slate-50/50 p-8 relative shadow-lg transition-all duration-300 hover:shadow-xl border border-slate-100">
             <h3 className="text-sm font-bold text-slate-800 mb-8 uppercase tracking-widest">Internal Structure:</h3>
             
             <div className="relative flex items-center h-[280px]">
                {/* Center Object */}
                <div className="flex flex-col items-center gap-3 ml-12">
                    <div className="relative z-20 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-rose-50 overflow-hidden border border-rose-100">
                       <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
                       <Icons.Package size={32} className="text-rose-600 relative z-10" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tighter">Component Object</span>
                 </div>

                {/* SVG Colored Arrows */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none z-10" viewBox="0 0 500 280">
                   <defs>
                      <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="3" orientation="auto" markerUnits="strokeWidth">
                         <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                      </marker>
                      <marker id="arrow-emerald" markerWidth="10" markerHeight="10" refX="8" refY="3" orientation="auto" markerUnits="strokeWidth">
                         <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                      </marker>
                      <marker id="arrow-purple" markerWidth="10" markerHeight="10" refX="8" refY="3" orientation="auto" markerUnits="strokeWidth">
                         <path d="M0,0 L0,6 L9,3 z" fill="#a855f7" />
                      </marker>
                      <marker id="arrow-rose" markerWidth="10" markerHeight="10" refX="8" refY="3" orientation="auto" markerUnits="strokeWidth">
                         <path d="M0,0 L0,6 L9,3 z" fill="#f43f5e" />
                      </marker>
                   </defs>
                   <path d="M160 140 Q250 80 320 60" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-blue)" />
                   <path d="M160 140 Q250 120 320 115" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-emerald)" />
                   <path d="M160 140 Q250 160 320 170" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-purple)" />
                   <path d="M160 140 Q250 220 320 235" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-rose)" />
                </svg>

                {/* Labels */}
                <div className="absolute right-8 top-0 bottom-0 flex flex-col justify-between py-2 w-[200px] z-20">
                    <div className="rounded-xl bg-blue-100 p-3 shadow-sm border border-blue-200">
                       <div className="text-[11px] font-bold text-blue-950">[[Props]]</div>
                       <div className="text-[10px] font-medium text-blue-800">Read-only external data</div>
                    </div>
                    <div className="rounded-xl bg-emerald-100 p-3 shadow-sm border border-emerald-200">
                       <div className="text-[11px] font-bold text-emerald-950">[[State]]</div>
                       <div className="text-[10px] font-medium text-emerald-800">Internal mutable data</div>
                    </div>
                    <div className="rounded-xl bg-purple-100 p-3 shadow-sm border border-purple-200">
                       <div className="text-[11px] font-bold text-purple-950">[[Hooks]]</div>
                       <div className="text-[10px] font-medium text-purple-800">State & Effects</div>
                    </div>
                    <div className="rounded-xl bg-rose-100 p-3 shadow-sm border border-rose-200">
                       <div className="text-[11px] font-bold text-rose-950">[[VirtualDOM]]</div>
                       <div className="text-[10px] font-medium text-rose-800">UI representation</div>
                    </div>
                </div>
             </div>
          </div>

          {/* Right Box: Key Points */}
          <div className="lg:col-span-5 rounded-[24px] bg-white p-8 relative shadow-lg transition-all duration-300 hover:shadow-xl">
              <h3 className="text-sm font-bold text-slate-900 mb-8 uppercase tracking-widest">Key Points:</h3>
              <ul className="space-y-6">
                 {[
                   'Components are conceptually pure functions.',
                   'Props must be treated as immutable.',
                   'Rendering is a pure operation that stays the same for same props.',
                   'Multiple hooks can be attached to one component.'
                 ].map((pt, i) => (
                   <li key={i} className="flex items-start gap-4 text-[14px] font-medium text-slate-800 leading-tight">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 shadow-sm mt-0.5 border border-orange-200">
                         <Icons.Check size={14} className="text-orange-900" aria-hidden="true" />
                      </div>
                      <span>{pt}</span>
                   </li>
                 ))}
              </ul>
          </div>
        </div>
      </section>

      {/* 2. Rendering & Reconciliation */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>2</div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">2. Rendering & Reconciliation</h2>
        </div>
        <p className="text-[14px] font-medium text-slate-800">Updates are batched and processed in the reconciliation phase.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="flex items-center justify-between gap-2 p-8 bg-slate-50 rounded-[32px] shadow-sm">
              <div className="flex flex-col items-center gap-3">
                 <div className="relative flex h-20 w-16 flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-2 shadow-sm border border-slate-200">
                    <Icons.Layout size={24} className="text-indigo-800" aria-hidden="true" />
                 </div>
                 <span className="text-[9px] font-bold text-indigo-950 uppercase tracking-wider">Virtual DOM</span>
              </div>
              <Icons.ArrowRight size={16} className="text-slate-600" />
              <div className="flex flex-col items-center gap-3">
                  <div className="flex h-20 w-24 items-center justify-center rounded-xl bg-emerald-100 p-4 text-center shadow-sm relative overflow-hidden border border-emerald-200">
                    <div className="absolute inset-0 bg-emerald-200/30 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-950 relative z-10">Diffing Engine</span>
                 </div>
                 <span className="text-[9px] font-bold text-emerald-950 uppercase tracking-wider">Reconciler</span>
              </div>
              <Icons.ArrowRight size={16} className="text-slate-600" />
               <div className="flex flex-col items-center gap-3">
                  <Icons.Zap size={40} className="text-orange-950 animate-pulse" aria-hidden="true" />
                  <span className="text-[9px] font-bold text-orange-950 uppercase tracking-wider">DOM Commit</span>
               </div>
           </div>
           <div className="rounded-[32px] overflow-hidden bg-[#0f172a] shadow-2xl relative h-[300px]">
              <div 
                className="p-8 font-mono text-[13px] leading-relaxed overflow-auto h-full hide-scrollbar text-indigo-100"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                tabIndex={0}
                role="region"
                aria-label="Component Reconciliation Code"
              >
                 <p className="mb-1"><span className="text-pink-400">const</span> <span className="text-indigo-300">handleUpdate</span> = () <span className="text-pink-400">={'>'}</span> {`{`}</p>
                 <p className="mb-1 ml-4 text-slate-500">// Multiple updates batched</p>
                 <p className="mb-1 ml-4"><span className="text-emerald-400">setCount</span>(c <span className="text-pink-400">={'>'}</span> c + <span className="text-rose-400">1</span>);</p>
                 <p className="mb-1 ml-4"><span className="text-emerald-400">setCount</span>(c <span className="text-pink-400">={'>'}</span> c + <span className="text-rose-400">1</span>);</p>
                 <p className="mb-1 ml-4 mt-4 text-slate-500">// Result: Single Render Cycle</p>
                 <p className="mb-1 ml-4"><span className="text-indigo-300">console</span>.<span className="text-emerald-400">log</span>(<span className="text-emerald-400">'Batched!'</span>);</p>
                 <p>{`};`}</p>
              </div>
              <div className="absolute bottom-6 right-6 flex items-center gap-4">
                 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">RECONCILIATION</span>
                 <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors shadow-lg">
                    <Icons.Copy size={16} />
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* 3. Component Resolution */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>3</div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">3. Component Resolution</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
           <div className="space-y-6 py-4">
              <h4 className="text-[14px] font-bold text-slate-900">Resolution procedure:</h4>
              <div className="space-y-4">
                 {[
                   'If a component receives new props → it becomes dirty.',
                   'If state updates → it schedules a re-render.',
                   'If parent re-renders → children are re-evaluated.'
                 ].map((step, i) => (
                   <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-100/20 border border-orange-100/50">
                     <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-950 border border-orange-200">{i + 1}</div>
                     <p className="text-[13px] font-medium text-slate-800">{step}</p>
                   </div>
                 ))}
              </div>
           </div>
           <div className="rounded-[32px] overflow-hidden bg-[#0f172a] shadow-2xl relative h-[300px]">
              <div 
                className="p-8 font-mono text-[13px] leading-relaxed overflow-auto h-full hide-scrollbar text-indigo-100"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                tabIndex={0}
                role="region"
                aria-label="Component Resolution Code"
              >
                 <p className="mb-1"><span className="text-pink-400">const</span> <span className="text-indigo-300">element</span> = <span className="text-emerald-400">renderComponent</span>({`{`}</p>
                 <p className="ml-4"><span className="text-orange-300">type</span>: <span className="text-emerald-400">'UserCard'</span>,</p>
                 <p className="ml-4"><span className="text-orange-300">props</span>: {`{`} <span className="text-orange-300">id</span>: <span className="text-rose-400">101</span> {`}`} </p>
                 <p>{`});`}</p>
                 
                 <p className="mb-1 mt-6 text-slate-500">// Resolution handles the UI tree</p>
                 <p className="mb-1"><span className="text-pink-400">const</span> <span className="text-indigo-300">ui</span> = <span className="text-emerald-400">element</span>.<span className="text-indigo-300">resolve</span>({`{`}</p>
                 <p className="ml-4"><span className="text-orange-300">onSuccess</span>: (data) <span className="text-pink-400">={'>'}</span> <span className="text-emerald-400">"{'<'}"</span><span className="text-pink-400">Profile</span> <span className="text-orange-300">data</span>={`{data} /`}<span className="text-emerald-400">{">"}</span>,</p>
                 <p className="ml-4"><span className="text-orange-300">onError</span>: (err) <span className="text-pink-400">={'>'}</span> <span className="text-emerald-400">"{'<'}"</span><span className="text-pink-400">ErrorUI</span> <span className="text-orange-300">msg</span>={`{err.message} /`}<span className="text-emerald-400">{">"}</span></p>
                 <p>{`});`}</p>
              </div>
              <div className="absolute bottom-6 right-6 flex items-center gap-4">
                 <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors shadow-lg">
                    <Icons.Copy size={16} />
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* 4. Recursive Composition */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>4</div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight">4. Recursive Composition</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 rounded-[32px] bg-slate-50 p-10 space-y-10">
              <div className="space-y-2">
                 <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">RENDERING CHAIN:</h3>
                 <p className="text-[14px] font-medium text-slate-800">Each component returns a new element recursively until reaching basic units.</p>
              </div>
              
              <div 
                className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar"
                tabIndex={0}
                role="region"
                aria-label="Component Composition Flow"
              >
                  {/* Parent */}
                  <div className="rounded-2xl bg-emerald-100 px-8 py-4 text-[14px] font-bold text-emerald-950 shadow-sm border border-emerald-200">Parent</div>
                 
                 {/* Transition 1 */}
                 <div className="flex items-center gap-2 px-2">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-orange-100 shadow-sm">
                       <Icons.ArrowRight size={12} className="text-orange-900" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tighter">RENDERS</span>
                 </div>

                  {/* Child */}
                  <div className="rounded-2xl bg-blue-100 px-8 py-4 text-[14px] font-bold text-blue-950 shadow-sm border border-blue-200">Child</div>

                 {/* Transition 2 */}
                 <div className="flex items-center gap-2 px-2">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-orange-100 shadow-sm">
                       <Icons.ArrowRight size={12} className="text-orange-900" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tighter">RENDERS</span>
                 </div>

                  {/* Grandchild */}
                  <div className="rounded-2xl bg-purple-100 px-8 py-4 text-[14px] font-bold text-purple-950 shadow-sm border border-purple-200">Grandchild</div>

                 {/* Transition 3 */}
                 <div className="flex items-center gap-2 px-2">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-orange-100 shadow-sm">
                       <Icons.ArrowRight size={12} className="text-orange-900" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tighter">COMMITS</span>
                 </div>

                  {/* Real DOM */}
                  <div className="rounded-2xl bg-rose-100 px-8 py-4 text-[14px] font-bold text-rose-950 shadow-sm border border-rose-200">Real DOM</div>
              </div>
           </div>

           <div className="lg:col-span-4 rounded-[32px] bg-orange-100/10 p-10 flex flex-col justify-center relative overflow-hidden shadow-sm shadow-orange-100/10 border border-slate-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16" />
              <h4 className="text-[14px] font-bold text-orange-950 uppercase tracking-widest mb-4">Why it matters?</h4>
              <p className="text-[14px] font-medium text-slate-800 leading-relaxed relative z-10">
                This allows you to build powerful, scalable user interfaces by composing simple, reusable primitives step-by-step.
              </p>
           </div>
        </div>
      </section>

    </div>
  );
}
