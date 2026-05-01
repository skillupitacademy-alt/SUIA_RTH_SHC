'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function ProjectContent({ onNext }: { onNext?: () => void }) {
  const brand = useBrand();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Icons.Search size={18} /> },
    { id: 'features', label: 'Features', icon: <Icons.Zap size={18} /> },
    { id: 'resources', label: 'Resources', icon: <Icons.Link size={18} /> },
  ];

  const buildItems = [
    'Create a Component for the User Table Header.',
    'Build a row component that handles individual user data.',
    'Implement a Modal component for adding new users.',
    'Use composition to build the full Dashboard page.'
  ];

  const deliverableItems = [
    'Fully functional React dashboard.',
    'Source code on GitHub repository.',
    'A short video demo of the UI interactions.',
    'Project documentation and README.'
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-slate-950 tracking-tight">Capstone Project</h1>
          <p className="text-[14px] font-medium text-slate-800">Master Component Architecture through this hands-on project.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-orange-50 px-4 py-2 border border-orange-100 shadow-sm">
             <Icons.Trophy size={16} className="text-orange-600" />
             <span className="text-xs font-bold text-orange-950">+500 XP</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2 border border-slate-100 shadow-sm">
             <Icons.Calendar size={16} className="text-slate-600" />
             <span className="text-xs font-bold text-slate-950">2 Days Left</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[40px] bg-[#fffbf9] p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100">
         <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full -mr-48 -mt-48 blur-3xl" />
         
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
               <div 
                 className="inline-flex items-center rounded-full px-4 py-1 text-[11px] font-bold tracking-wide uppercase shadow-sm"
                 style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}
               >
                 intermediate project
               </div>
               <h2 className="text-4xl font-bold text-slate-900 leading-tight">
                  User Management <br/> <span style={{ color: brand.primaryColorDark }}>System Dashboard</span>
               </h2>
               <p className="text-[16px] font-medium leading-relaxed text-slate-800">
                  Build a professional User Management Dashboard where every part of the interface is a modular, reusable component. This project will test your ability to compose complex layouts from simple building blocks.
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3 border border-slate-200">
                       <div className="flex items-center gap-2 text-rose-950">
                          <Icons.Layers size={18} aria-hidden="true" />
                          <span className="text-xs font-bold uppercase tracking-widest">Real-world Use</span>
                       </div>
                       <p className="text-[11px] font-bold text-slate-800">Admin dashboards, CRM systems, user panels</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3 border border-slate-200">
                       <div className="flex items-center gap-2 text-orange-950">
                          <Icons.Code2 size={18} aria-hidden="true" />
                          <span className="text-xs font-bold uppercase tracking-widest">Skills You'll Use</span>
                       </div>
                       <div className="flex flex-wrap gap-1.5">
                          {['Promises', 'async/await', 'Fetch API', 'Error Handling', 'DOM', 'JSON'].map(s => (
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
                        src="/project_mockup.svg" 
                        alt="User Management Dashboard Mockup" 
                        className="w-full h-auto"
                     />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-100 pb-0 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-slate-950' : 'text-slate-600 hover:text-slate-950'}`}
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
            <div className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
               <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 border border-slate-100">
                     <Icons.Layers size={22} aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-950 tracking-tight">What You Need To Build</h2>
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
            
            {/* Starter Template */}
            <div className="rounded-[24px] bg-slate-50 p-6 flex items-center justify-between gap-6 shadow-xl transition-all duration-300 hover:-translate-y-1">
               <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-orange-950 border border-orange-100">
                     <Icons.Code2 size={24} aria-hidden="true" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-slate-950">Starter Template</h4>
                     <p className="text-[12px] font-medium text-slate-800">Get started with a boilerplate code.</p>
                  </div>
               </div>
                <button className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all border border-slate-200">
                   <Icons.Download size={16} aria-hidden="true" /> Download Starter
                </button>
            </div>
         </div>
         
         <div className="lg:col-span-5 space-y-8">
            <div className="rounded-[32px] bg-white p-10 shadow-xl space-y-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
               <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-950 border border-rose-200">
                     <Icons.Gift size={22} aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-950 tracking-tight">Deliverables</h2>
               </div>
               <ul className="space-y-5">
                   {deliverableItems.map((item, i) => (
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
