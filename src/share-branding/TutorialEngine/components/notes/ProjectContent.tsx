import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

export function ProjectContent({ onNext }: { onNext?: () => void }) {
  const brand = useBrand();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Icons.Layout size={16} /> },
    { id: 'requirements', label: 'Requirements', icon: <Icons.ClipboardList size={16} /> },
    { id: 'resources', label: 'Resources', icon: <Icons.BookOpen size={16} /> },
    { id: 'submission', label: 'Submission', icon: <Icons.Upload size={16} /> },
    { id: 'mentor', label: 'Mentor Review', icon: <Icons.UserCheck size={16} /> },
  ];

  const buildItems = [
    'Fetch all users from the API and display them in a table.',
    'Add a search input to filter users by name.',
    'Add functionality to create a new user.',
    'Edit existing user details.',
    'Delete a user with confirmation.',
    'Handle all errors gracefully and show appropriate messages.'
  ];

  const deliverableItems = [
    'Fully functional dashboard',
    'Create / Read / Update / Delete',
    'Search & filter users',
    'Clean & commented code',
    'README with setup instructions'
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header & Breadcrumbs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
           <span>JavaScript</span> <Icons.ChevronRight size={10} /> <span>Asynchronous JavaScript</span> <Icons.ChevronRight size={10} /> <span>Promises</span> <Icons.ChevronRight size={10} /> <span className="text-slate-600">2.9 Project</span>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">Project: User Management Dashboard</h1>
              <div className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600 border border-slate-200">Intermediate</div>
            </div>
            <p className="text-[15px] font-medium text-slate-500">Build a user management dashboard that fetches and manages users using Promises and async/await.</p>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-slate-400">
                <Icons.Clock size={18} />
                <span className="text-sm font-black text-slate-600">5-7 hrs</span>
             </div>
             <div className="flex items-center gap-2 text-rose-500">
                <Icons.Star size={18} fill="currentColor" />
                <span className="text-sm font-black">+400 XP</span>
             </div>
          </div>
        </div>
      </div>

      {/* Project Overview Banner */}
      <section className="rounded-[40px] bg-gradient-to-br from-rose-50 to-orange-50 p-10 relative overflow-hidden group border border-slate-200 shadow-xl transition-all duration-300 hover:-translate-y-1">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-8 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-rose-500">
                     <Icons.ClipboardList size={22} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Project Overview</h2>
               </div>
               <p className="text-[16px] font-medium leading-relaxed text-slate-600">
                  You will build a fully functional User Management Dashboard that interacts with a mock REST API. This project will help you apply Promises, async/await, error handling, and DOM manipulation in a real-world scenario.
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3 border border-slate-200">
                     <div className="flex items-center gap-2 text-rose-500">
                        <Icons.Globe size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Real-world Use</span>
                     </div>
                     <p className="text-[11px] font-bold text-slate-500">Admin dashboards, CRM systems, user panels</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3 border border-slate-200">
                     <div className="flex items-center gap-2 text-orange-500">
                        <Icons.Code2 size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Skills You'll Use</span>
                     </div>
                     <div className="flex flex-wrap gap-1.5">
                        {['Promises', 'async/await', 'Fetch API', 'Error Handling', 'DOM', 'JSON'].map(s => (
                           <span key={s} className="px-2 py-0.5 rounded-md bg-slate-50 text-[9px] font-black text-slate-500 uppercase">{s}</span>
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
            className={`flex items-center gap-2 px-6 py-4 text-sm font-black transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
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
            <div className="rounded-[32px] bg-white p-10 shadow-xl border border-slate-200 space-y-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
               <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-800">
                     <Icons.Layers size={22} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">What You Need To Build</h2>
               </div>
               <ul className="space-y-6">
                  {buildItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                       <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-200">
                          <Icons.Check size={12} strokeWidth={4} />
                       </div>
                       <p className="text-[14px] font-bold text-slate-600 leading-tight">{item}</p>
                    </li>
                  ))}
               </ul>
            </div>
            
            {/* Starter Template */}
            <div className="rounded-[24px] bg-slate-50 p-6 flex items-center justify-between gap-6 border border-slate-200 shadow-xl transition-all duration-300 hover:-translate-y-1">
               <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-orange-500">
                     <Icons.Code2 size={24} />
                  </div>
                  <div>
                     <h4 className="text-sm font-black text-slate-800">Starter Template</h4>
                     <p className="text-[12px] font-medium text-slate-500">Get started with a boilerplate code.</p>
                  </div>
               </div>
               <button className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition-all border border-slate-200">
                  <Icons.Download size={16} /> Download Starter
               </button>
            </div>
         </div>
         
         <div className="lg:col-span-5 space-y-8">
            <div className="rounded-[32px] bg-white p-10 shadow-xl border border-slate-200 space-y-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
               <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                     <Icons.Gift size={22} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Deliverables</h2>
               </div>
               <ul className="space-y-5">
                  {deliverableItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                       <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                          <Icons.Check size={14} />
                       </div>
                       <p className="text-[13px] font-bold text-slate-600 leading-tight">{item}</p>
                    </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between gap-4 pt-10">
        <button className="group flex flex-1 items-center gap-4 rounded-2xl bg-white p-4 shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-left border border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-white transition-colors">
            <Icons.ArrowLeft size={18} className="text-slate-400 group-hover:text-slate-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous</p>
            <p className="text-sm font-black text-slate-800">Assignment</p>
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
            <p className="text-sm font-black">AI Tutor</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Icons.ArrowRight size={18} aria-hidden="true" />
          </div>
        </button>
      </div>
    </div>
  );
}
