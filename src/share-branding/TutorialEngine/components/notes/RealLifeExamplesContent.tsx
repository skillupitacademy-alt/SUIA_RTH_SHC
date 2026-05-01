import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function RealLifeExamplesContent({ data }: { data: SubtopicNotesViewData['mainContent']['realLifeExamples'] }) {
  const brand = useBrand();
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">{data.title}</h1>
          <p className="text-[14px] font-medium text-slate-500">{data.intro}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-slate-500 shadow-sm hover:bg-gray-50 transition-all active:scale-95" aria-label="Bookmark">
            <Icons.Bookmark size={18} aria-hidden="true" />
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-gray-50 transition-all active:scale-95">
            <Icons.Share2 size={18} aria-hidden="true" /> Share
          </button>
        </div>
      </div>

      {/* Hero Analogy Card */}
      <div 
        className="relative overflow-hidden rounded-[40px] border p-8 md:p-10 shadow-sm transition-all duration-700"
        style={{ 
          borderColor: `${brand.primaryColor}22`, 
          background: `linear-gradient(135deg, ${brand.primaryColor}08, ${brand.primaryColor}03)` 
        }}
      >
        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1 w-full">
            <div className="relative group">
              <div 
                className="absolute -inset-4 rounded-full blur-3xl opacity-30 transition-all duration-700 group-hover:opacity-50"
                style={{ backgroundColor: brand.primaryColor }}
              ></div>
              <img 
                src={data.hero.image} 
                alt="Modular Kitchen Analogy" 
                className="relative z-10 w-full max-h-[300px] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
          <div className="flex-[1.2] space-y-6">
            <div 
              className="inline-flex items-center rounded-full px-4 py-1 text-[11px] font-black tracking-wide uppercase"
              style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}
            >
              {data.hero.badge}
            </div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">
              {data.hero.title}
            </h2>
            <p className="text-[15px] font-medium leading-relaxed text-slate-600">
              {data.hero.description}
            </p>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border shadow-sm" style={{ borderColor: `${brand.primaryColor}11` }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${brand.primaryColor}15` }}>
                <Icons.Lightbulb size={20} style={{ color: brand.primaryColor }} fill={`${brand.primaryColor}33`} aria-hidden="true" />
              </div>
              <p className="text-[13px] font-bold italic" style={{ color: brand.primaryColor }}>
                {data.hero.highlight}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
           <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${brand.primaryColor}15` }}>
              <Icons.LayoutGrid size={18} style={{ color: brand.primaryColor }} aria-hidden="true" />
           </div>
           <h2 className="text-xl font-black text-slate-900 tracking-tight">Real Life Scenarios</h2>
        </div>
        <p className="text-sm font-medium text-slate-500">More everyday examples to make it crystal clear.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.scenarios.map((item) => (
            <div key={item.id} className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div 
                className="mb-6 flex aspect-square items-center justify-center rounded-2xl bg-slate-50 p-4 transition-colors group-hover:bg-opacity-50"
                style={{ backgroundColor: `${brand.primaryColor}05` } as any}
              >
                <img src={item.image} alt={item.title} className="w-full h-full object-contain drop-shadow-lg" />
              </div>
              <h3 className="mb-2 text-[15px] font-black text-slate-900">{item.title}</h3>
              <p className="mb-6 flex-1 text-[12px] font-medium leading-relaxed text-slate-500">{item.description}</p>
              <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: brand.primaryColor }}>
                {item.footer}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Walkthrough Section */}
      <div 
        className="rounded-[40px] p-10 border shadow-inner"
        style={{ backgroundColor: `${brand.primaryColor}05`, borderColor: `${brand.primaryColor}11` }}
      >
        <div className="mb-10 space-y-2">
          <h2 className="text-2xl font-black text-slate-900">{data.walkthrough.title}</h2>
          <p className="text-sm font-medium text-slate-500">Detailed example: {data.walkthrough.subtitle}</p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
          {data.walkthrough.steps.map((step, i) => {
            const Icon = (Icons as any)[step.icon] || Icons.Circle;
            return (
              <React.Fragment key={step.id}>
                <div className="relative z-10 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md transition-transform hover:rotate-6">
                    <Icon size={24} style={{ color: brand.primaryColor }} aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ backgroundColor: brand.primaryColor }}>{i + 1}</span>
                      <h3 className="text-sm font-black text-slate-900">{step.title}</h3>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-6 h-px pointer-events-none" style={{ left: `${(i * 25) + 12.5}%`, width: '12.5%' }}>
                     <Icons.ChevronRight className="mx-auto" size={20} style={{ color: `${brand.primaryColor}44` }} aria-hidden="true" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-12 flex items-center gap-3 rounded-2xl p-4 border" style={{ backgroundColor: `${brand.primaryColor}11`, borderColor: `${brand.primaryColor}22` }}>
          <Icons.Star size={20} style={{ color: brand.primaryColor }} fill={`${brand.primaryColor}33`} aria-hidden="true" />
          <p className="text-[13px] font-bold" style={{ color: brand.primaryColor }}>
            {data.walkthrough.footer}
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4 pb-10">
        <button className="group flex flex-1 items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:bg-gray-50 active:scale-95">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-white transition-colors">
            <Icons.ArrowLeft size={18} className="text-slate-400 group-hover:text-slate-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous</p>
            <p className="text-sm font-black text-slate-700">Layman Explanation</p>
          </div>
        </button>

        <button className="hidden sm:flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-8 py-4 text-sm font-black text-slate-600 shadow-sm hover:bg-gray-50 transition-all active:scale-95">
           <Icons.LayoutGrid size={18} aria-hidden="true" /> Back to Subtopic
        </button>

        <button className="group flex flex-1 items-center justify-between gap-4 rounded-2xl p-4 text-left shadow-xl transition-all hover:scale-[1.02] active:scale-95" style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}>
          <div className="text-white">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Next</p>
            <p className="text-sm font-black text-white">Technical Explanation</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Icons.ArrowRight size={18} className="text-white" aria-hidden="true" />
          </div>
        </button>
      </div>

    </div>
  );
}
