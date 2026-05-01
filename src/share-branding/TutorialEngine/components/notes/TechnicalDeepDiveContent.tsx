import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function TechnicalDeepDiveContent({ data, onNext }: { data?: SubtopicNotesViewData['mainContent']['technicalDeepDive']; onNext?: () => void }) {
  const brand = useBrand();
  if (!data) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <span>JavaScript</span> <Icons.ChevronRight size={10} /> <span>Components</span> <Icons.ChevronRight size={10} /> <span className="text-slate-600">Technical Deep Dive</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">{data.title}</h1>
            <div 
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm border border-slate-200"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {data.badge}
            </div>
          </div>
          <p className="text-[14px] font-medium text-slate-500">{data.intro}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-gray-50 transition-all active:scale-95 border border-slate-200">
            <Icons.Bookmark size={16} aria-hidden="true" /> Bookmark
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-gray-50 transition-all active:scale-95 border border-slate-200" aria-label="Share">
            <Icons.Share2 size={16} aria-hidden="true" /> Share
          </button>
        </div>
      </div>

      {/* 0. Intro Section */}
      <section className="rounded-[40px] bg-[#fffbf9] p-10 border border-slate-200 shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
           <div className="space-y-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">What is a Component?</h2>
              <p className="text-[16px] font-medium leading-relaxed text-slate-600">
                A <strong>Component</strong> is a self-contained unit of UI that manages its own logic and appearance. It represents a piece of the eventual full page.
              </p>
              <div className="flex items-center gap-6 py-2">
                 <div className="flex flex-col items-center gap-2">
                   <div className="rounded-[18px] bg-orange-50 px-6 py-3 text-sm font-black text-orange-600 shadow-sm shadow-orange-100/50">Pending</div>
                   <span className="text-[12px] text-slate-500 font-bold">Mounting / Loading</span>
                 </div>
                 <Icons.ArrowRight size={18} className="text-slate-900 mt-[-25px]" />
                 <div className="flex flex-col items-center gap-2">
                   <div className="rounded-[18px] bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-600 shadow-sm shadow-emerald-100/50">Fulfilled</div>
                   <span className="text-[12px] text-slate-500 font-bold text-center">Rendered /<br/>Active UI</span>
                 </div>
                 <Icons.ArrowRight size={18} className="text-slate-900 mt-[-25px]" />
                 <div className="flex flex-col items-center gap-2">
                   <div className="rounded-[18px] bg-rose-50 px-6 py-3 text-sm font-black text-rose-600 shadow-sm shadow-rose-100/50">Rejected</div>
                   <span className="text-[12px] text-slate-500 font-bold text-center">Error /<br/>Fallback</span>
                 </div>
              </div>
           </div>
           <div className="rounded-[32px] overflow-hidden bg-[#0f172a] shadow-2xl relative h-[300px] border border-slate-200">
              <div 
                className="p-8 font-mono text-[13px] leading-relaxed overflow-auto h-full hide-scrollbar text-indigo-100"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                tabIndex={0}
                role="region"
                aria-label="Component Lifecycle Mapping Code"
              >
                 <p className="text-slate-500 mb-2">{`{/* Component Lifecycle Mapping */}`}</p>
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
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">JSX</span>
                 <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors shadow-lg border border-slate-200">
                    <Icons.Copy size={16} />
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* 1. Component Anatomy */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 border border-slate-200 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: brand.primaryColor }}>1</div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">1. Component Anatomy</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Box: Internal Structure */}
          <div className="lg:col-span-7 rounded-[24px] bg-slate-50/50 p-8 relative border border-slate-200 shadow-lg transition-all duration-300 hover:shadow-xl">
             <h3 className="text-sm font-bold text-slate-500 mb-8">Internal Structure:</h3>
             
             <div className="relative flex items-center h-[280px]">
                {/* Center Object */}
                <div className="flex flex-col items-center gap-3 ml-12">
                   <div className="relative z-20 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-rose-50 overflow-hidden">
                      <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
                      <Icons.Package size={32} className="text-rose-500 relative z-10" />
                   </div>
                   <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Component Object</span>
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
                   <div className="rounded-xl bg-blue-50/80 p-3 shadow-sm border border-slate-200">
                      <div className="text-[11px] font-black text-blue-600">[[Props]]</div>
                      <div className="text-[10px] font-bold text-blue-400">Read-only external data</div>
                   </div>
                   <div className="rounded-xl bg-emerald-50/80 p-3 shadow-sm border border-slate-200">
                      <div className="text-[11px] font-black text-emerald-600">[[State]]</div>
                      <div className="text-[10px] font-bold text-emerald-400">Internal mutable data</div>
                   </div>
                   <div className="rounded-xl bg-purple-50/80 p-3 shadow-sm border border-slate-200">
                      <div className="text-[11px] font-black text-purple-600">[[Hooks]]</div>
                      <div className="text-[10px] font-bold text-purple-400">State & Effects</div>
                   </div>
                   <div className="rounded-xl bg-rose-50/80 p-3 shadow-sm border border-slate-200">
                      <div className="text-[11px] font-black text-rose-600">[[VirtualDOM]]</div>
                      <div className="text-[10px] font-bold text-rose-400">UI representation</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Box: Key Points */}
          <div className="lg:col-span-5 rounded-[24px] bg-white p-8 relative border border-slate-200 shadow-lg transition-all duration-300 hover:shadow-xl">
             <h3 className="text-sm font-black text-slate-900 mb-8">Key Points</h3>
             <ul className="space-y-6">
                {[
                  'Components are conceptually pure functions.',
                  'Props must be treated as immutable.',
                  'Rendering is a pure operation that stays the same for same props.',
                  'Multiple hooks can be attached to one component.'
                ].map((pt, i) => (
                  <li key={i} className="flex items-start gap-4 text-[14px] font-bold text-slate-700 leading-tight">
                     <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 shadow-sm mt-0.5">
                        <Icons.Check size={14} className="text-orange-600" />
                     </div>
                     <span>{pt}</span>
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </section>

      {/* 2. Rendering & Reconciliation */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 border border-slate-200 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: brand.primaryColor }}>2</div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">2. Rendering & Reconciliation</h2>
        </div>
        <p className="text-[14px] font-medium text-slate-500">Updates are batched and processed in the reconciliation phase.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="flex items-center justify-between gap-2 p-8 bg-slate-50 rounded-[32px] shadow-sm border border-slate-200">
              <div className="flex flex-col items-center gap-3">
                 <div className="relative flex h-20 w-16 flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-2 shadow-sm border border-slate-200">
                    <Icons.Layout size={24} className="text-indigo-500" />
                 </div>
                 <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">Virtual DOM</span>
              </div>
              <Icons.ArrowRight size={16} className="text-slate-400" />
              <div className="flex flex-col items-center gap-3">
                 <div className="flex h-20 w-24 items-center justify-center rounded-xl bg-emerald-50 p-4 text-center shadow-sm relative overflow-hidden border border-slate-200">
                    <div className="absolute inset-0 bg-emerald-100/30 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-800 relative z-10">Diffing Engine</span>
                 </div>
                 <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Reconciler</span>
              </div>
              <Icons.ArrowRight size={16} className="text-slate-400" />
              <div className="flex flex-col items-center gap-3">
                 <Icons.Zap size={40} className="text-orange-500 animate-pulse" />
                 <span className="text-[9px] font-black text-orange-700 uppercase tracking-wider">DOM Commit</span>
              </div>
           </div>
           <div className="rounded-[32px] overflow-hidden bg-[#0f172a] shadow-2xl relative h-[300px] border border-slate-200">
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
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">RECONCILIATION</span>
                 <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors shadow-lg">
                    <Icons.Copy size={16} />
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* 3. Component Resolution */}
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 border border-slate-200 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: brand.primaryColor }}>3</div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">3. Component Resolution</h2>
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
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50/30">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-black text-orange-600">{i + 1}</div>
                    <p className="text-[13px] font-bold text-slate-700">{step}</p>
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
      <section className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 border border-slate-200 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: brand.primaryColor }}>4</div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">4. Recursive Composition</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 rounded-[32px] bg-slate-50 p-10 space-y-10 border border-slate-200">
              <div className="space-y-2">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">RENDERING CHAIN:</h3>
                 <p className="text-[14px] font-medium text-slate-500">Each component returns a new element recursively until reaching basic units.</p>
              </div>
              
              <div 
                className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar"
                tabIndex={0}
                role="region"
                aria-label="Component Composition Flow"
              >
                 {/* Parent */}
                 <div className="rounded-2xl bg-emerald-50 px-8 py-4 text-[14px] font-black text-emerald-600 shadow-sm">Parent</div>
                 
                 {/* Transition 1 */}
                 <div className="flex items-center gap-2 px-2">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-orange-50 shadow-sm">
                       <Icons.ArrowRight size={12} className="text-orange-500" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">RENDERS</span>
                 </div>

                 {/* Child */}
                 <div className="rounded-2xl bg-blue-50 px-8 py-4 text-[14px] font-black text-blue-600 shadow-sm">Child</div>

                 {/* Transition 2 */}
                 <div className="flex items-center gap-2 px-2">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-orange-50 shadow-sm">
                       <Icons.ArrowRight size={12} className="text-orange-500" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">RENDERS</span>
                 </div>

                 {/* Grandchild */}
                 <div className="rounded-2xl border border-purple-100 bg-purple-50 px-8 py-4 text-[14px] font-black text-purple-600 shadow-sm">Grandchild</div>

                 {/* Transition 3 */}
                 <div className="flex items-center gap-2 px-2">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
                       <Icons.ArrowRight size={12} className="text-orange-500" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">COMMITS</span>
                 </div>

                 {/* Real DOM */}
                 <div className="rounded-2xl bg-rose-50 px-8 py-4 text-[14px] font-black text-rose-600 shadow-sm">Real DOM</div>
              </div>
           </div>

           <div className="lg:col-span-4 rounded-[32px] bg-orange-50/20 p-10 flex flex-col justify-center relative overflow-hidden shadow-sm shadow-orange-100/10 border border-slate-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16" />
              <h4 className="text-[14px] font-black text-orange-600 uppercase tracking-widest mb-4">Why it matters?</h4>
              <p className="text-[14px] font-bold text-slate-700 leading-relaxed relative z-10">
                This allows you to build powerful, scalable user interfaces by composing simple, reusable primitives step-by-step.
              </p>
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
            <p className="text-sm font-black text-slate-800">Real Life Example</p>
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
            <p className="text-sm font-black">Code Example</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Icons.ArrowRight size={18} aria-hidden="true" />
          </div>
        </button>
      </div>

    </div>
  );
}
