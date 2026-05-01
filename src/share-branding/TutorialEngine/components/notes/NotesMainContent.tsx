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
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
          {data.breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <button className={`text-sm font-bold ${index === data.breadcrumbs.length - 1 ? 'text-slate-950 cursor-default' : 'text-slate-700 hover:text-slate-950 transition-colors'}`} disabled={index === data.breadcrumbs.length - 1}>
                {crumb}
              </button>
              {index < data.breadcrumbs.length - 1 && <Icons.ChevronRight size={14} className="text-slate-800" aria-hidden="true" />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 border border-slate-200">
            <Icons.ArrowLeft size={14} aria-hidden="true" /> Previous
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 border border-slate-200">
            Next Subtopic <Icons.ArrowRight size={14} aria-hidden="true" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm hover:bg-slate-50 border border-slate-200" aria-label="Bookmark subtopic">
            <Icons.Bookmark size={14} aria-hidden="true" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm hover:bg-slate-50 border border-slate-200" aria-label="More options">
            <Icons.MoreHorizontal size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Title & Meta */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-slate-950 tracking-tight">{data.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-900">
              <Icons.Clock size={14} aria-hidden="true" /> {data.meta.readTime}
            </span>
            <span className="flex items-center gap-1.5 text-amber-950 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
              <Icons.BarChart2 size={14} aria-hidden="true" /> {data.meta.level}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-950 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
              <Icons.Star size={14} aria-hidden="true" /> +{data.meta.xp} XP
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
        className="flex gap-4 rounded-xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1"
        style={{ backgroundColor: `${brand.primaryColor}10` }}
      >
        <div className="shrink-0 mt-0.5">
          <Icons.Lightbulb size={20} style={{ color: brand.primaryColorDark }} aria-hidden="true" />
        </div>
        <p className="text-sm font-medium leading-relaxed text-slate-800">
          <strong className="font-bold" style={{ color: brand.primaryColorDark }}>In Simple Words:</strong> {data.simpleWords}
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-10">
        {data.sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
            <p className="text-[15px] font-medium leading-relaxed text-slate-800 whitespace-pre-wrap">
              {section.content}
            </p>

            {section.keyPoint && (
              <div className="flex gap-4 rounded-xl bg-amber-100 p-5 mt-6 shadow-xl transition-all duration-300 hover:-translate-y-1 border border-amber-200">
                <Icons.Star size={20} className="text-amber-900 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-[13px] font-bold text-amber-950 mb-1">Key Point</h3>
                  <p className="text-[13px] font-medium text-amber-950">{section.keyPoint}</p>
                </div>
              </div>
            )}

            {section.codeExample && (
              <div className="mt-6 space-y-4">
                <div className="relative overflow-hidden rounded-xl bg-[#1e293b] p-5 shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <button className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition-colors border border-white/10" aria-label="Copy code snippet">
                    <Icons.Copy size={12} aria-hidden="true" /> Copy
                  </button>
                  <pre className="text-[13px] leading-relaxed text-slate-200 font-mono overflow-x-auto">
                    <code>{section.codeExample.code}</code>
                  </pre>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 border border-slate-200">
                  <p className="text-[13px] font-medium text-slate-900 font-mono whitespace-pre-wrap">
                    {section.codeExample.output}
                  </p>
                </div>
              </div>
            )}
          </section>
        ))}
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
