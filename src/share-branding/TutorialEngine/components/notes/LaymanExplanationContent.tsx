import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function LaymanExplanationContent({ data }: { data: SubtopicNotesViewData['mainContent']['laymanExplanation'] }) {
  const brand = useBrand();
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Badge & Actions */}
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold shadow-sm"
          style={{ borderColor: brand.primaryColor, color: brand.primaryColor, backgroundColor: `${brand.primaryColor}08` }}
        >
          <Icons.Zap size={14} fill={brand.primaryColor} aria-hidden="true" />
          {data.badge}
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-gray-50" aria-label="Bookmark">
            <Icons.Bookmark size={16} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-gray-50" aria-label="Listen">
            <Icons.Volume2 size={16} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-gray-50" aria-label="Share">
            <Icons.Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Title & Intro */}
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">{data.title}</h1>
        <p className="text-[15px] font-medium leading-relaxed text-slate-600">
          {data.intro}
        </p>
      </div>

      {/* Main Concept Card */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold" style={{ color: brand.primaryColor }}>What is a Component?</h2>
        <div className="flex flex-col md:flex-row gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex-1 flex justify-center items-center">
            <img 
              src={data.mainConcept.image} 
              alt="Lego Component Illustration" 
              className="max-h-[220px] object-contain drop-shadow-xl"
            />
          </div>
          <div className="flex-[1.5] space-y-4 flex flex-col justify-center">
            <p className="text-xl font-medium leading-tight text-slate-800">
              {data.mainConcept.title} <span className="font-black" style={{ color: brand.primaryColor }}>{data.mainConcept.description}</span>
            </p>
            <p className="text-[15px] font-medium leading-relaxed text-slate-600">
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
        <h2 className="text-lg font-bold" style={{ color: brand.primaryColor }}>Why Do We Need Components?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.reasonGrid.map((item) => {
            const Icon = (Icons as any)[item.icon] || Icons.HelpCircle;
            return (
              <div key={item.id} className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200 bg-[#fff9f5] space-y-3 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="p-3 rounded-xl bg-white shadow-sm">
                   <Icon size={24} style={{ color: brand.primaryColor }} aria-hidden="true" />
                </div>
                <h3 className="text-sm font-black text-slate-800">{item.title}</h3>
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Types Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold" style={{ color: brand.primaryColor }}>Architecture in Simple Words</h2>
        <p className="text-[13px] font-bold text-slate-500">Different layers mean different sizes of building blocks.</p>
        
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-gray-50">
              {data.typesTable.map((type) => {
                const Icon = (Icons as any)[type.icon] || Icons.HelpCircle;
                return (
                  <tr key={type.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 w-12">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${type.iconBg}`}>
                        <Icon size={16} aria-hidden="true" />
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-black text-slate-800">{type.label}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-slate-500">{type.description}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-block rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                        {type.example}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Tip */}
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
        <Icons.Lightbulb size={20} className="text-amber-500 fill-amber-50" aria-hidden="true" />
        <p className="text-[13px] font-bold text-slate-600">
          {data.footerTip}
        </p>
      </div>

    </div>
  );
}
