import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function TechnicalDeepDiveContent({ data }: { data?: SubtopicNotesViewData['mainContent']['technicalDeepDive'] }) {
  const brand = useBrand();
  if (!data) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <span>JavaScript</span> <Icons.ChevronRight size={10} /> <span>Components</span> <Icons.ChevronRight size={10} /> <span className="text-slate-600">Deep Dive</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">{data.title}</h1>
            <span 
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {data.badge}
            </span>
          </div>
          <p className="text-[14px] font-medium text-slate-500">{data.intro}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-gray-50 transition-all active:scale-95">
            <Icons.Bookmark size={16} aria-hidden="true" /> Bookmark
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-slate-500 shadow-sm hover:bg-gray-50 transition-all active:scale-95" aria-label="Share">
            <Icons.Share2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Sections */}
      {data.sections.map((section, idx) => (
        <section key={section.id} className="space-y-6">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {idx + 1}
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{section.title}</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <p className="text-[15px] font-medium leading-relaxed text-slate-600">
                {section.content}
              </p>

              {section.keyPoints && (
                <div className="space-y-3 rounded-3xl border border-gray-100 bg-slate-50/50 p-6">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Key Points</h4>
                  <ul className="space-y-3">
                    {section.keyPoints.map((point, k) => (
                      <li key={k} className="flex items-start gap-2 text-[13px] font-bold text-slate-700">
                        <Icons.CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: brand.primaryColor }} aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.highlight && (
                <div className="rounded-2xl border-l-4 p-4" style={{ borderColor: brand.primaryColor, backgroundColor: `${brand.primaryColor}08` }}>
                   <p className="text-[13px] font-bold text-slate-700 italic">"{section.highlight}"</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
               {/* Diagram Rendering */}
               {section.diagram && (
                 <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    {section.diagram.type === 'anatomy' && (
                      <div className="flex flex-col md:flex-row items-center gap-6">
                         <div className="relative h-24 w-24 flex items-center justify-center rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
                            <Icons.Box size={40} style={{ color: brand.primaryColor }} aria-hidden="true" />
                            <div className="absolute -bottom-2 whitespace-nowrap text-[10px] font-black text-slate-400 uppercase tracking-tighter">Component Object</div>
                         </div>
                         <div className="flex-1 space-y-2">
                            {section.diagram.data.slots.map((slot: any, si: number) => (
                              <div key={si} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-100">
                                 <span className="text-[11px] font-black text-indigo-600 tracking-tighter">{slot.label}</span>
                                 <span className="text-[10px] font-medium text-slate-500">{slot.desc}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}

                    {section.diagram.type === 'flow' && (
                      <div className="flex items-center justify-between gap-2">
                        {section.diagram.data.map((step: string, si: number) => (
                          <React.Fragment key={si}>
                            <div className="flex flex-col items-center gap-2">
                               <div className="flex h-12 w-24 items-center justify-center rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-700 shadow-sm text-center px-1">
                                  {step}
                               </div>
                            </div>
                            {si < section.diagram.data.length - 1 && <Icons.ArrowRight size={14} className="text-slate-300" />}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {section.diagram.type === 'chain' && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                         {section.diagram.data.map((item: string, si: number) => (
                           <div key={si} className="flex items-center gap-2 shrink-0">
                              <div className="rounded-lg px-4 py-2 border text-[11px] font-black" style={{ borderColor: `${brand.primaryColor}44`, backgroundColor: `${brand.primaryColor}05`, color: brand.primaryColor }}>
                                {item}
                              </div>
                              {si < section.diagram.data.length - 1 && <Icons.Plus size={12} className="text-slate-400" />}
                           </div>
                         ))}
                      </div>
                    )}
                 </div>
               )}

               {/* Code Rendering */}
               {section.code && (
                 <div className="rounded-3xl overflow-hidden bg-[#0f172a] shadow-2xl">
                    <div className="flex items-center justify-between bg-slate-800/50 px-4 py-2 border-b border-slate-700/50">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.code.language}</span>
                       <button className="text-slate-500 hover:text-white transition-colors" aria-label="Copy code">
                          <Icons.Copy size={14} />
                       </button>
                    </div>
                    <pre className="p-6 text-[12px] font-medium leading-relaxed text-indigo-100 overflow-x-auto hide-scrollbar">
                      <code>{section.code.code}</code>
                    </pre>
                    {section.code.output && (
                      <div className="bg-slate-900/50 p-4 border-t border-slate-700/50">
                         <p className="text-[11px] font-black text-emerald-400 tracking-tight italic">{section.code.output}</p>
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </section>
      ))}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4 pb-10">
        <button className="group flex flex-1 items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:bg-gray-50 active:scale-95">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-white transition-colors">
            <Icons.ArrowLeft size={18} className="text-slate-400 group-hover:text-slate-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous</p>
            <p className="text-sm font-black text-slate-700">Real Life Examples</p>
          </div>
        </button>

        <button className="hidden sm:flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-8 py-4 text-sm font-black text-slate-600 shadow-sm hover:bg-gray-50 transition-all active:scale-95">
           <Icons.LayoutGrid size={18} aria-hidden="true" /> Back to Subtopic
        </button>

        <button className="group flex flex-1 items-center justify-between gap-4 rounded-2xl p-4 text-left shadow-xl transition-all hover:scale-[1.02] active:scale-95" style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}>
          <div className="text-white">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Next</p>
            <p className="text-sm font-black text-white">Code Example</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Icons.ArrowRight size={18} className="text-white" aria-hidden="true" />
          </div>
        </button>
      </div>

    </div>
  );
}
