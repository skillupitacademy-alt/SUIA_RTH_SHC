import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function NotesMainContent({ data, isStandalone = true }: { data: SubtopicNotesViewData['mainContent']; isStandalone?: boolean }) {
  const brand = useBrand();

  const content = (
    <div className={`space-y-8 transition-all duration-500 ${isStandalone ? 'mx-auto w-full max-w-[900px] px-8 py-10' : ''}`}>
        
        {/* Breadcrumbs & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-500">
            {data.breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <button className={`text-sm font-bold ${index === data.breadcrumbs.length - 1 ? 'text-gray-900 cursor-default' : 'text-slate-500 hover:text-gray-900 transition-colors'}`} disabled={index === data.breadcrumbs.length - 1}>
                  {crumb}
                </button>
                {index < data.breadcrumbs.length - 1 && <Icons.ChevronRight size={14} className="text-slate-500" />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900">
              <Icons.ArrowLeft size={14} /> Previous
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900">
              Next Subtopic <Icons.ArrowRight size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 shadow-sm hover:bg-gray-50" aria-label="Bookmark subtopic">
              <Icons.Bookmark size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 shadow-sm hover:bg-gray-50" aria-label="More options">
              <Icons.MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Title & Meta */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">{data.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Icons.Clock size={14} /> {data.meta.readTime}
              </span>
              <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                <Icons.BarChart2 size={14} /> {data.meta.level}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                <Icons.Star size={14} /> +{data.meta.xp} XP
              </span>
            </div>
            <button 
              className="flex items-center gap-1.5 text-[11px] font-bold transition-colors hover:underline text-primary-dark"
            >
              <Icons.Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        {/* In Simple Words Box */}
        <div 
          className="flex gap-4 rounded-xl p-5 border border-slate-200 shadow-xl transition-all duration-300 hover:-translate-y-1"
          style={{ backgroundColor: `${brand.primaryColor}08` }}
        >
          <div className="shrink-0 mt-0.5">
            <Icons.Lightbulb size={20} className="text-primary-dark" />
          </div>
          <p className="text-sm font-medium leading-relaxed text-gray-700">
            <strong className="text-primary-dark">In Simple Words:</strong> {data.simpleWords}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10">
          {data.sections.map((section) => (
            <section key={section.id} className="space-y-4">
              <h2 className="text-xl font-black text-gray-900">{section.title}</h2>
              <p className="text-[15px] font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">
                {section.content}
              </p>
              
              {section.keyPoint && (
                <div className="flex gap-4 rounded-xl bg-amber-50 p-5 border border-slate-200 mt-6 shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Icons.Star size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[13px] font-bold text-amber-900 mb-1">Key Point</h3>
                    <p className="text-[13px] font-medium text-amber-800">{section.keyPoint}</p>
                  </div>
                </div>
              )}

              {section.codeExample && (
                <div className="mt-6 space-y-4">
                  <div className="relative overflow-hidden rounded-xl bg-[#1e293b] p-5 shadow-xl border border-slate-200 transition-all duration-300 hover:-translate-y-1">
                    <button className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition-colors border border-white/10" aria-label="Copy code">
                      <Icons.Copy size={12} /> Copy
                    </button>
                    <pre className="text-[13px] leading-relaxed text-slate-300 font-mono overflow-x-auto">
                      <code>{section.codeExample.code}</code>
                    </pre>
                  </div>
                  <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100">
                    <p className="text-[13px] font-medium text-slate-700 font-mono whitespace-pre-wrap">
                      {section.codeExample.output}
                    </p>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
        
        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-8 pb-10">
           <button className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">← Previous: Components & Props</button>
           <button 
             className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
             style={{ backgroundColor: brand.primaryColor }}
           >
             Continue to State & Lifecycle →
           </button>
        </div>

    </div>
  );

  if (!isStandalone) return content;

  return (
    <main className="flex-1 overflow-y-auto hide-scrollbar bg-white">
      {content}
    </main>
  );
}
