'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function ProjectContent({ data, onNext }: { 
  data?: {
    title: string;
    description: string;
    xp: number;
    deadline: string;
    hero: {
      badge: string;
      title: string;
      description: string;
      image: string;
    };
    realWorldUse: string;
    skills: string[];
    buildItems: string[];
    deliverables: string[];
  };
  onNext?: () => void;
}) {
  const brand = useBrand();
  const [activeTab, setActiveTab] = useState('overview');

  // Use data from props or fallback to defaults
  const title = data?.title || 'Capstone Project';
  const description = data?.description || 'Master concepts through this hands-on project.';
  const xp = data?.xp || 500;
  const deadline = data?.deadline || '2 Days Left';
  const hero = data?.hero || {
    badge: 'project',
    title: 'Default Project',
    description: 'Build something amazing.',
    image: '/project_mockup.svg'
  };
  const realWorldUse = data?.realWorldUse || 'Real-world applications';
  const skills = data?.skills || ['Skill 1', 'Skill 2'];
  const buildItems = data?.buildItems || ['Build item 1', 'Build item 2'];
  const deliverables = data?.deliverables || ['Deliverable 1', 'Deliverable 2'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Icons.Search size={18} /> },
    { id: 'features', label: 'Features', icon: <Icons.Zap size={18} /> },
    { id: 'resources', label: 'Resources', icon: <Icons.Link size={18} /> },
  ];

  return (
    <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:space-y-12">
      
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{title}</h1>
          <p className="text-[14px] font-medium text-slate-800">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-orange-50 px-4 py-2 border border-orange-100 shadow-sm">
             <Icons.Trophy size={16} className="text-orange-600" />
             <span className="text-xs font-bold text-orange-950">+{xp} XP</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2 border border-slate-100 shadow-sm">
             <Icons.Calendar size={16} className="text-slate-600" />
             <span className="text-xs font-bold text-slate-950">{deadline}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-10">
         
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
               <div 
                 className="inline-flex items-center rounded-full px-4 py-1 text-[11px] font-bold tracking-wide uppercase shadow-sm"
                 style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColorDark }}
               >
                 {hero.badge}
               </div>
               <h2 className="break-words text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  {hero.title.split(' ').slice(0, -1).join(' ')} <br/> <span style={{ color: brand.primaryColorDark }}>{hero.title.split(' ').slice(-1)}</span>
               </h2>
               <p className="text-[16px] font-medium leading-relaxed text-slate-800">
                  {hero.description}
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3 border border-slate-200">
                       <div className="flex items-center gap-2 text-rose-950">
                          <Icons.Layers size={18} aria-hidden="true" />
                          <span className="text-xs font-bold uppercase tracking-widest">Real-world Use</span>
                       </div>
                       <p className="text-[11px] font-bold text-slate-800">{realWorldUse}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3 border border-slate-200">
                       <div className="flex items-center gap-2 text-orange-950">
                          <Icons.Code2 size={18} aria-hidden="true" />
                          <span className="text-xs font-bold uppercase tracking-widest">Skills You'll Use</span>
                       </div>
                       <div className="flex flex-wrap gap-1.5">
                          {skills.map(s => (
                             <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-bold text-slate-800 uppercase border border-slate-200">{s}</span>
                          ))}
                       </div>
                    </div>
               </div>
            </div>
            
            <div className="lg:col-span-5 relative hidden lg:block">
               {/* Proper Illustration Mockup */}
               <div className="relative transform hover:scale-105 transition-transform duration-700">
                  <div className="rounded-[32px] overflow-hidden shadow-2xl border border-rose-100/30 bg-white">
                     <img 
                        src={hero.image}
                        alt="Project Mockup" 
                        className="w-full h-auto"
                     />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex min-w-0 flex-wrap items-center gap-1 border-b border-gray-100 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-4 text-sm font-bold transition-all sm:px-6 ${activeTab === tab.id ? 'text-slate-950' : 'text-slate-600 hover:text-slate-950'}`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-7 space-y-8">
            <div className="space-y-8 rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-10">
               <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 border border-slate-100">
                     <Icons.Layers size={22} aria-hidden="true" />
                  </div>
                  <h2 className="break-words text-xl font-bold tracking-tight text-slate-950">What You Need To Build</h2>
               </div>
               <ul className="space-y-6">
                   {buildItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                       <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-950 text-white shadow-sm">
                          <Icons.Check size={12} strokeWidth={4} aria-hidden="true" />
                       </div>
                       <p className="text-[14px] font-medium text-slate-900 leading-tight">{item}</p>
                    </li>
                  ))}
               </ul>
            </div>
            
         </div>
         
         <div className="lg:col-span-5 space-y-8">
            <div className="space-y-8 rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-10">
               <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-950 border border-rose-200">
                     <Icons.Gift size={22} aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-950 tracking-tight">Deliverables</h2>
               </div>
               <ul className="space-y-5">
                   {deliverables.map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                       <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-950 border border-emerald-200">
                          <Icons.Check size={14} aria-hidden="true" />
                       </div>
                       <p className="text-[13px] font-medium text-slate-800 leading-tight">{item}</p>
                    </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>

    </div>
  );
}
