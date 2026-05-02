import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function LaymanExplanationContent({ data }: { data: SubtopicNotesViewData['mainContent']['laymanExplanation'] }) {
  const brand = useBrand();
  if (!data) return null;

  return (
    <div className="min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">



      {/* Title & Intro */}
      <div className="space-y-4">
        <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{data.title}</h1>
        <p className="text-[15px] font-medium leading-relaxed text-slate-800">
          {data.intro}
        </p>
      </div>

      {/* Main Concept Card */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">What is a Component?</h2>
        <div className="flex min-w-0 flex-col gap-6 rounded-3xl bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-8 md:flex-row md:gap-8">
          <div className="flex-1 flex justify-center items-center">
            <img
              src={data.mainConcept.image}
              alt="Lego Component Illustration"
              className="max-h-[220px] object-contain drop-shadow-xl"
            />
          </div>
          <div className="flex-[1.5] space-y-4 flex flex-col justify-center">
            <p className="text-xl font-bold leading-tight text-slate-900">
              {data.mainConcept.title} <span className="font-bold" style={{ color: brand.primaryColor }}>{data.mainConcept.description}</span>
            </p>
            <p className="text-[15px] font-medium leading-relaxed text-slate-800">
              You can use the same brick to build different parts of your castle, and if one brick breaks, you just replace it without destroying the whole thing.
            </p>
            <p className="text-[14px] font-bold" style={{ color: brand.primaryColor }}>
              {data.mainConcept.example}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Reasons */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Why Do We Need Components?</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {data.reasonGrid.map((item) => {
            const Icon = (Icons as any)[item.icon] || Icons.HelpCircle;
            return (
              <div key={item.id} className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#fff9f5] space-y-3 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="p-3 rounded-xl bg-white shadow-sm">
                  <Icon size={24} style={{ color: brand.primaryColor }} aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="text-[11px] font-medium text-slate-700 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Types Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Architecture in Simple Words</h2>
        <p className="text-[13px] font-bold text-slate-800">Different layers mean different sizes of building blocks.</p>

        <div className="min-w-0 rounded-2xl bg-white p-3 shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="space-y-2">
            {data.typesTable.map((type) => {
              const Icon = (Icons as any)[type.icon] || Icons.HelpCircle;
              return (
                <div key={type.id} className="grid min-w-0 grid-cols-[auto_1fr] gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50/50 sm:grid-cols-[auto_110px_1fr_auto] sm:items-center">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${type.iconBg}`}>
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <span className="min-w-0 break-words text-sm font-bold text-slate-900">{type.label}</span>
                  <span className="col-span-2 min-w-0 break-words text-xs font-medium text-slate-700 sm:col-span-1">{type.description}</span>
                  <span className="col-span-2 inline-flex w-fit rounded-md border border-emerald-200 bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-900 sm:col-span-1">
                    {type.example}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Tip */}
      <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-4 border border-slate-200">
        <Icons.Lightbulb size={20} className="text-amber-800 fill-amber-50" aria-hidden="true" />
        <p className="text-[13px] font-bold text-slate-900">
          {data.footerTip}
        </p>
      </div>

    </div>
  );
}
