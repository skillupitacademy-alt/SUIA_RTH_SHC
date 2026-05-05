"use client";

import React, { useContext, useEffect } from 'react';
import { ShellContext } from '../../ShellContext';
import { 
  ChevronRight, Search, Plus, Filter, MoreVertical, Copy, 
  Download, FileText, CheckCircle2, Clock, XCircle, AlertCircle,
  BarChart3, History, MessageSquare, Sparkles, Wand2, ArrowRight,
  Database, Layers, Cpu, Globe, LayoutList, Share2, Eye
} from 'lucide-react';

export default function LaymanGenerationPage() {
  const { setHeaderTitle, setHeaderSubtitle } = useContext(ShellContext);

  useEffect(() => {
    setHeaderTitle('Layman Content Studio');
    setHeaderSubtitle('Generate high-fidelity beginner-friendly educational content');
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, []);
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* Left Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        
        {/* Step 1: Hierarchy Selection */}
        <section className="bg-white/80 backdrop-blur rounded-xl border-t border-white/60 shadow-2xl p-6 space-y-6 -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-500 text-white flex items-center justify-center font-bold text-base">1</div>
            <h2 className="text-lg font-bold text-slate-900 font-outfit">Hierarchy Selection</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Domain", value: "Frontend Development" },
              { label: "Subject", value: "JavaScript" },
              { label: "Topic", value: "JavaScript Basics" },
              { label: "Subtopic", value: "What is JavaScript?" }
            ].map((field, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                <div className="relative group">
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 transition-all cursor-pointer">
                    <option>{field.value}</option>
                  </select>
                  <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-pink-100 flex items-center justify-center text-pink-600 shadow-sm">
                <Layers size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-pink-600 uppercase tracking-widest">Selected Path</p>
                <p className="text-base font-bold text-slate-700 mt-0.5">Frontend Development &nbsp;›&nbsp; JavaScript &nbsp;›&nbsp; JavaScript Basics &nbsp;›&nbsp; What is JavaScript?</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Subtopic ID</p>
              <p className="text-sm font-mono font-bold text-slate-500 mt-0.5">sub_8f7a2e1c9d3b4a56</p>
            </div>
          </div>
        </section>

        {/* Process Steps Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { id: 1, label: "Hierarchy Selection", status: "completed", color: "bg-pink-500", active: false },
            { id: 2, label: "Prompt Generation", status: "active", color: "bg-orange-500", active: true },
            { id: 3, label: "AI Paste (Draft)", status: "pending", color: "bg-[#8B5CF6]", active: false },
            { id: 4, label: "Validation", status: "pending", color: "bg-[#F97316]", active: false },
            { id: 5, label: "Publish", status: "pending", color: "bg-[#10B981]", active: false },
          ].map((step, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${step.active ? 'bg-white border-slate-200 shadow-sm' : 'bg-transparent border-transparent opacity-60'}`}>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-black text-white shrink-0 ${step.color}`}>
                {step.id}
              </div>
              <span className={`text-sm font-bold whitespace-nowrap ${step.active ? 'text-slate-900' : 'text-slate-500'}`}>{step.label}</span>
            </div>
          ))}
        </div>

        {/* Main Generation Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Prompt Templates (xl:col-span-3) */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white/80 backdrop-blur rounded-xl border-t border-white/60 shadow-2xl overflow-hidden h-[800px] flex flex-col -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
              <div className="p-4 border-b border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 font-outfit">Prompt Templates</h3>
                  <button className="text-pink-600 bg-pink-50 p-1.5 rounded-lg hover:bg-[#FFE4E6] transition-colors border border-pink-100">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search templates..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-pink-500" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {[
                  { name: "Layman - Beginner Friendly (v2.1)", status: "Default", color: "bg-[#10B981]", text: "Best for absolute beginners, simple words, real life analogies", date: "May 20, 2025" },
                  { name: "Layman - School Level (v1.8)", status: "Active", color: "#6366F1", text: "For school students, easy examples", date: "May 18, 2025" },
                  { name: "Layman - Visual Learner (v1.6)", status: "Active", color: "#10B981", text: "Focus on analogies, stories, and mental models", date: "May 15, 2025" },
                  { name: "Layman - Career Switcher (v1.4)", status: "Active", color: "#10B981", text: "For professionals switching to tech", date: "May 10, 2025" },
                  { name: "Layman - Mobile Optimized (v1.3)", status: "Draft", color: "#F97316", text: "Concise content for mobile reading", date: "May 08, 2025" },
                ].map((tpl, i) => (
                  <div key={i} className={`p-3 rounded-xl border transition-all cursor-pointer group ${i === 0 ? 'bg-pink-50/30 border-pink-100' : 'border-transparent hover:bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-sm font-bold leading-tight group-hover:text-slate-900 ${i === 0 ? 'text-pink-600' : 'text-slate-700'}`}>{tpl.name}</h4>
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 border ${i === 0 ? 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {tpl.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{tpl.text}</p>
                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-tight">Updated: {tpl.date}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">Showing 1 to 5 of 15</span>
                <button className="text-sm font-bold text-pink-600 flex items-center gap-1 hover:underline">View All <ArrowRight size={12} /></button>
              </div>
            </div>
          </div>

          {/* Column 2: Editor/Viewer (xl:col-span-6) */}
          <div className="xl:col-span-6 space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-xl border-t border-white/60 shadow-2xl h-[800px] flex flex-col overflow-hidden relative -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  {["Prompt Templates", "Educational Architectures", "UI Architectures"].map((tab, i) => (
                    <button key={i} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${i === 0 ? 'bg-white text-pink-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:bg-pink-600 transition-all">
                    <Sparkles size={16} /> Generate Prompt
                  </button>
                  <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50/20">
                {/* Header Info */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 font-outfit">Template: Layman - Beginner Friendly (v2.1)</h3>
                  <p className="text-sm text-slate-500 font-medium">Architecture: Beginner First &nbsp;|&nbsp; UI: Card-Story Format</p>
                </div>

                {/* Prompt Content */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <p className="text-base text-slate-700 leading-relaxed font-medium italic">
                      "You are an expert educator who explains complex technical topics in the simplest possible way for absolute beginners."
                    </p>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Topic Context:</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Domain: Frontend Development<br />
                        Subject: JavaScript<br />
                        Topic: JavaScript Basics<br />
                        Subtopic: What is JavaScript?
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Generation Rules:</h4>
                      <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                        <li>1. Simple Overview - Explain the concept as if talking to a 5-year-old.</li>
                        <li>2. Real-life Analogy - Use a familiar non-tech example.</li>
                        <li>3. Why It Exists - The problem it solves in plain words.</li>
                        <li>4. Simple Use Cases - Common everyday examples.</li>
                        <li>5. Beginner Breakdown - Step by step simplified logic.</li>
                        <li>6. Mental Model - How to visualize the concept.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-4 pt-4 border-t border-slate-200/60">
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <AlertCircle size={14} /> Prompt Metadata
                   </h4>
                   <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                      {[
                        { label: "Prompt ID", value: "prm_01HV8J8Q2F9S6Z7M109C" },
                        { label: "Version", value: "2.1" },
                        { label: "Created By", value: "Super Admin" },
                        { label: "Created At", value: "May 24, 2025 11:24 AM" }
                      ].map((meta, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">{meta.label}</span>
                          <span className="text-sm font-bold text-slate-700">{meta.value}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-50 flex items-center justify-between shrink-0">
                <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-bold hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/10">
                  <Copy size={16} /> Copy Prompt
                </button>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Download size={16} /> Export .txt
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <FileText size={16} /> Export .json
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: AI Drafts (xl:col-span-3) */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white/80 backdrop-blur rounded-xl border-t border-white/60 shadow-2xl overflow-hidden h-[800px] flex flex-col -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
              <div className="p-4 border-b border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 font-outfit">AI Drafts <span className="text-sm font-medium text-slate-400 ml-1">(From Pasted Content)</span></h3>
                  <button className="text-pink-600 bg-pink-50 px-2.5 py-1.5 rounded-lg hover:bg-[#FFE4E6] transition-colors border border-pink-100 text-sm font-black flex items-center gap-1">
                    <Plus size={14} /> New Draft
                  </button>
                </div>
                <div className="flex gap-2">
                   <div className="relative flex-1">
                     <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input type="text" placeholder="Search drafts..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-pink-500" />
                   </div>
                   <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <Filter size={16} />
                   </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {[
                  { name: "Draft - What is JavaScript?", model: "GPT-4o", score: "78/100", status: "Draft", color: "#ec4899", date: "May 24, 2025 11:20 AM" },
                  { name: "Draft - Variables in JS", model: "Claude 3.5", score: "82/100", status: "In Review", color: "#F97316", date: "May 24, 2025 10:45 AM" },
                  { name: "Draft - Data Types", model: "Gemini 1.5 Pro", score: "94/100", status: "Approved", color: "#10B981", date: "May 23, 2025 04:15 PM" },
                  { name: "Draft - Functions in JS", model: "GPT-4o", score: "94/100", status: "Published", color: "#6366F1", date: "May 23, 2025 02:30 PM" },
                  { name: "Draft - Operators", model: "Claude 3.5", score: "45/100", status: "Rejected", color: "#EF4444", date: "May 22, 2025 09:10 PM" },
                ].map((draft, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-pink-500/30 hover:shadow-lg transition-all group relative cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">{draft.name}</h4>
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 border ${
                        draft.status === 'Draft' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                        draft.status === 'In Review' ? 'bg-[#FFF7ED] text-[#F97316] border-[#FFEDD5]' :
                        draft.status === 'Approved' ? 'bg-[#F0FDF4] text-[#10B981] border-[#DCFCE7]' :
                        draft.status === 'Published' ? 'bg-[#EEF2FF] text-[#6366F1] border-[#E0E7FF]' :
                        'bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]'
                      }`}>
                        {draft.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">Model: {draft.model} &nbsp;•&nbsp; Score: <span className="text-slate-700">{draft.score}</span></p>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-tight">Created: {draft.date}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">Showing 1 to 5 of 18 drafts</span>
                <button className="text-sm font-bold text-pink-600 flex items-center gap-1 hover:underline">View All <ArrowRight size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
