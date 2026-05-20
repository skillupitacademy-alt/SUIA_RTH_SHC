import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

export function TechnicalDeepDiveContent({ data }: { data?: SubtopicNotesViewData['mainContent']['technicalDeepDive'] }) {
   const brand = useBrand();
   if (!data) return null;

   return (
      <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:space-y-12">

         {/* Header */}
         <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">

               <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{data.title}</h2>
                  <div
                     className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                     style={{ backgroundColor: brand.primaryColor }}
                  >
                     {data.badge}
                  </div>
               </div>
               <p className="text-[14px] font-medium text-slate-800">{data.intro}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
               <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95" aria-label="Bookmark this technical deep dive">
                  <Icons.Bookmark size={16} aria-hidden="true" /> Bookmark
               </button>
               <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95" aria-label="Share this technical deep dive">
                  <Icons.Share2 size={16} aria-hidden="true" /> Share
               </button>
            </div>
         </div>

         {/* Dynamic Sections */}
         {data.sections && data.sections.map((section, index) => (
            <section key={section.id} aria-label={`Technical section: ${section.title}`} className="space-y-8 rounded-[32px] bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-10">
               <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>{index + 1}</div>
                  <h3 className="break-words text-xl font-bold tracking-tight text-slate-950">{section.title}</h3>
               </div>

               {/* Content */}
               <p className="text-[14px] font-medium text-slate-800 leading-relaxed">{section.content}</p>

               {/* Diagram Asset if provided */}
               {section.diagramAsset && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-3">
                     <SVGIconRenderer 
                        dataUri={typeof section.diagramAsset === 'string' ? section.diagramAsset : section.diagramAsset?.dataUri} 
                        alt={typeof section.diagramAsset === 'object' ? section.diagramAsset?.alt : 'Technical Diagram'} 
                        className="w-full h-auto max-h-[450px] object-contain mx-auto"
                     />
                  </div>
               )}

               {/* Key Points */}
               {section.keyPoints && section.keyPoints.length > 0 && (
                  <div className="rounded-[24px] bg-slate-50/50 backdrop-blur-md p-5 sm:p-8">
                     <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Key Points:</h4>
                     <ul className="space-y-4">
                        {section.keyPoints.map((point, idx) => (
                           <li key={idx} className="flex items-start gap-4 text-[14px] font-medium text-slate-800 leading-tight">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 shadow-sm mt-0.5 border border-orange-200">
                                 <Icons.Check size={14} className="text-orange-900" aria-hidden="true" />
                              </div>
                              <span>{point}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}

               {/* Steps */}
               {section.steps && section.steps.length > 0 && (
                  <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Process:</h4>
                     {section.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-100/20 border border-orange-100/50">
                           <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-950 border border-orange-200">{idx + 1}</div>
                           <p className="text-[13px] font-medium text-slate-800">{step.text}</p>
                        </div>
                     ))}
                  </div>
               )}

               {/* Code Block */}
               {section.code && (
                  <div className="rounded-[32px] overflow-hidden bg-[#0f172a] shadow-2xl relative">
                     <div
                        className="h-full overflow-auto p-4 font-mono text-[12px] leading-relaxed text-indigo-100 hide-scrollbar sm:p-8 sm:text-[13px]"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        tabIndex={0}
                        role="region"
                        aria-label="Code Example"
                     >
                        <pre className="text-indigo-100 whitespace-pre-wrap break-words">{section.code.code}</pre>
                        {section.code.output && (
                           <div className="mt-4 pt-4 border-t border-slate-700">
                              <p className="text-slate-400 text-[11px] mb-2">Output:</p>
                              <p className="text-emerald-400">{section.code.output}</p>
                           </div>
                        )}
                     </div>
                     <div className="absolute bottom-4 right-4 flex items-center gap-4">
                        <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:inline">{section.code.language?.toUpperCase() || 'CODE'}</span>
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors shadow-lg" aria-label="Copy code">
                           <Icons.Copy size={16} aria-hidden="true" />
                        </button>
                     </div>
                  </div>
               )}

               {/* Highlight/Warning */}
               {section.highlight && (
                  <div className="rounded-[24px] bg-amber-50 border border-amber-200 p-5 sm:p-8">
                     <div className="flex items-start gap-4">
                        <Icons.AlertTriangle size={20} className="text-amber-600 shrink-0 mt-1" aria-hidden="true" />
                        <p className="text-[14px] font-medium text-amber-900 leading-relaxed">{section.highlight}</p>
                     </div>
                  </div>
               )}
            </section>
         ))}

      </div>
   );
}
