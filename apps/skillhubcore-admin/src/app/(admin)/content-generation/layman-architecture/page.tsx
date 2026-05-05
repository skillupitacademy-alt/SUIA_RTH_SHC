"use client";

import React, { useState, useEffect, useContext } from 'react';
import { ShellContext } from '../../ShellContext';
import { 
  ChevronDown, Plus, Info, Edit2, MoreVertical, CheckCircle2, 
  Copy, ArrowRight, Eye, RotateCcw, Share2, Download, 
  Trash2, Globe, Layout, Palette, Brain, Layers, History,
  FileText, Zap, ShieldCheck, ClipboardList, BookOpen, Search,
  PlayCircle, FileDown, FileUp, Settings, ExternalLink, XCircle
} from 'lucide-react';

export default function EducationalArchitecturePage() {
  const { setHeaderTitle, setHeaderSubtitle } = useContext(ShellContext);
  const [activeTab, setActiveTab] = useState('Universal Architecture (Fixed)');

  useEffect(() => {
    setHeaderTitle('Educational Architecture');
    setHeaderSubtitle('Design universal beginner-friendly learning experience for every domain');
    
    // Cleanup on unmount (optional but good practice)
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, []);

  const tabs = [
    'Universal Architecture (Fixed)',
    'Domain Adaptations (Flexible)',
    'Renderer Mapping',
    'Learner Psychology',
    'Learning Progression',
    'Version History'
  ];

  return (
    <div className="space-y-6">
      


      {/* Step 1: Select Scope */}
      <section className="bg-white/80 backdrop-blur rounded-xl border-t border-white/60 shadow-2xl p-6 -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-orange-200">1</div>
          <h2 className="text-lg font-bold text-slate-900 font-outfit">Select Scope</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Domain', value: 'Frontend Development' },
            { label: 'Subject', value: 'JavaScript' },
            { label: 'Topic', value: 'JavaScript Basics' },
            { label: 'Subtopic', value: 'What is JavaScript?' }
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">{item.label}</label>
              <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-base font-bold text-slate-700 cursor-pointer hover:border-pink-200 hover:bg-pink-50/10 transition-all">
                <span className="truncate">{item.value}</span>
                <ChevronDown size={18} className="text-slate-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <span className="text-sm font-bold text-slate-400 uppercase">Subtopic ID</span>
            <code className="text-sm font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-100">sub_8f7a2e1c9d3b4a56</code>
            <button className="text-slate-400 hover:text-pink-600 transition-colors" aria-label="Copy ID">
              <Copy size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* D. Learning Flow (Recommended Sequence) */}
      <section className="bg-white/80 backdrop-blur rounded-xl border-t border-white/60 shadow-2xl p-6 -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
        <h3 className="text-sm font-bold text-slate-900 font-outfit mb-6">D. Learning Flow (Recommended Sequence)</h3>
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-1/2 -z-10"></div>
          {[
            { icon: Layout, label: 'Overview', color: 'bg-blue-500' },
            { icon: Zap, label: 'Analogy', color: 'bg-orange-500' },
            { icon: Brain, label: 'Why Exists', color: 'bg-pink-500' },
            { icon: Edit2, label: 'Use Cases', color: 'bg-emerald-500' },
            { icon: Layers, label: 'Breakdown', color: 'bg-indigo-500' },
            { icon: Palette, label: 'Mental Model', color: 'bg-purple-500' },
            { icon: Info, label: 'Confusions', color: 'bg-red-500' },
            { icon: RotateCcw, label: 'Summary', color: 'bg-teal-500' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`w-9 h-9 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white ${step.color}`}>
                <step.icon size={16} />
              </div>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{step.label}</span>
            </div>
          ))}
        </div>
      </section>


      {/* Step 2: Educational Architecture Management */}
      <section className="bg-white/80 backdrop-blur rounded-xl border-t border-white/60 shadow-2xl p-6 -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-orange-200">2</div>
            <h2 className="text-lg font-bold text-slate-900 font-outfit">Educational Architecture Management</h2>
          </div>
          
          <button className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 hover:bg-pink-700 transition-all active:scale-95">
            <Plus size={18} />
            New Architecture
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab 
                ? 'bg-pink-50 text-pink-600 shadow-sm border border-pink-100' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Grid (Matching Image Sections A-F) */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* A. Universal Layman Architecture (Left Column - 60%) */}
          <div className="col-span-12 xl:col-span-7 space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-2xl border-t border-white/60 shadow-2xl p-6 space-y-6 -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] font-outfit">A. Universal Layman Architecture (Fixed Across All Domains)</h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">These components remain the same sequence for every layman section.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-[#F0FDF4] text-[#166534] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#DCFCE7]">Standard Structure</span>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-2 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
                      <th className="px-2 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Component</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Purpose</th>
                      <th className="px-2 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Required</th>
                      <th className="px-2 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                      <th className="px-2 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { id: 1, name: 'Simple Overview', purpose: 'What this topic is in plain language', icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { id: 2, name: 'Everyday Analogy', purpose: 'Connect concept to real life', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50' },
                      { id: 3, name: 'Why It Exists', purpose: 'Why this concept matters', icon: Brain, color: 'text-pink-600', bg: 'bg-pink-50' },
                      { id: 4, name: 'Simple Use Cases', purpose: 'Basic practical examples', icon: Edit2, color: 'text-orange-500', bg: 'bg-orange-50' },
                      { id: 5, name: 'Beginner Breakdown', purpose: 'Explain parts simply', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { id: 6, name: 'Visual Mental Model', purpose: 'Easy imagination aid', icon: Palette, color: 'text-amber-500', bg: 'bg-amber-50' },
                      { id: 7, name: 'Common Beginner Confusions', purpose: 'Reduce fear and clear doubts', icon: Info, color: 'text-purple-600', bg: 'bg-purple-50' },
                      { id: 8, name: 'Simple Recap', purpose: 'Reinforce clarity and summary', icon: RotateCcw, color: 'text-red-500', bg: 'bg-red-50' },
                    ].map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-2 py-4 text-sm font-bold text-slate-700">{row.id}</td>
                        <td className="px-2 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${row.bg} flex items-center justify-center ${row.color} shrink-0`}>
                              <row.icon size={16} />
                            </div>
                            <span className="font-bold text-[#1E293B] text-sm">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500 font-medium">{row.purpose}</td>
                        <td className="px-2 py-4 text-center">
                          <div className="flex justify-center">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center">
                          <span className="bg-[#F0FDF4] text-[#166534] px-2.5 py-1 rounded-lg text-xs font-bold border border-[#DCFCE7]">Active</span>
                        </td>
                        <td className="px-2 py-4 text-right">
                          <div className="flex items-center justify-end gap-3 text-slate-400">
                            <button className="hover:text-pink-600 transition-colors"><Edit2 size={16} /></button>
                            <button className="hover:text-slate-900 transition-colors"><MoreVertical size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-pink-500 hover:border-pink-200 hover:bg-pink-50/50 transition-all flex items-center justify-center gap-2">
                <Plus size={18} className="text-pink-600" />
                Add Custom Universal Component
              </button>
            </div>
          </div>

          {/* Right Column (B, C, D, E, F - 40%) */}
          <div className="col-span-12 xl:col-span-5 space-y-6">
            
            {/* B. Domain-Specific Adaptations & Selected Domain Preview Parent Card */}
            <div className="bg-white/80 backdrop-blur rounded-2xl border-t border-white/60 shadow-2xl p-6 space-y-10 -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
              
              {/* B. Domain-Specific Adaptations (Flexible) */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] font-outfit">B. Domain-Specific Adaptations (Flexible)</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Customize simplification methods for each domain.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Domain Type</label>
                  <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-base font-bold text-slate-700 cursor-pointer hover:border-pink-200 hover:bg-pink-50/10 transition-all">
                    <span>Full Stack Development</span>
                    <ChevronDown size={20} className="text-slate-400" />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-bold text-[#1E293B]">Adaptation Packs (Examples)</p>
                  <div className="space-y-3">
                    {[
                      { name: 'Programming Analogy Pack', count: '12 Analogies', desc: 'Arrays as shopping lists, Functions as machines', icon: Download, color: 'text-blue-500', bg: 'bg-blue-50' },
                      { name: 'Real World Story Pack', count: '8 Stories', desc: 'Code stories, daily life scenarios', icon: Globe, color: 'text-orange-500', bg: 'bg-orange-50' },
                      { name: 'Visual Metaphor Pack', count: '15 Visuals', desc: 'Box model, flow model, container model', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50' },
                      { name: 'Beginner Scenario Pack', count: '20 Scenarios', desc: 'Problem → simple solution examples', icon: Brain, color: 'text-pink-500', bg: 'bg-pink-50' },
                    ].map((pack, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white/50 hover:border-pink-200 transition-all cursor-pointer group">
                        <div className={`w-10 h-10 rounded-lg ${pack.bg} flex items-center justify-center ${pack.color} shrink-0`}>
                          <pack.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-[#334155] truncate">{pack.name}</p>
                            <span className="bg-purple-50 text-purple-600 text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">{pack.count}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{pack.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full py-3 border-2 border-dashed border-pink-100 rounded-xl text-sm font-bold text-pink-500 hover:bg-pink-50/50 transition-all flex items-center justify-center gap-2">
                  <Plus size={18} />
                  Add New Adaptation Pack
                </button>
              </div>

              <div className="border-t border-slate-100 pt-8">
                {/* Selected Domain Preview */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-[#1E293B] font-outfit">Selected Domain Preview</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">How the layman section will look in this domain.</p>
                  </div>
                  
                  <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-6 space-y-5">
                    <p className="text-sm font-bold text-[#334155]">Example: Explaining "Variable"</p>
                    <div className="space-y-3 text-sm leading-relaxed text-[#475569] font-medium">
                      <p><span className="font-bold text-[#334155]">Analogy:</span> A variable is like a labeled box where you can store anything.</p>
                      <p><span className="font-bold text-[#334155]">Real Life:</span> Like a container in your kitchen where you keep sugar.</p>
                      <p><span className="font-bold text-[#334155]">Mental Model:</span> Variable = Name + Value</p>
                    </div>
                    <div className="flex justify-center pt-2">
                      <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#F43F5E] text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-200 hover:bg-[#E11D48] active:scale-95 transition-all">
                        <Plus size={18} />
                        Preview Full Layman Section
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* H. Quick Actions Grid (Moved to Sidebar) */}
            <div className="bg-white/80 backdrop-blur rounded-2xl border-t border-white/60 shadow-2xl p-6 space-y-6 -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
              <h3 className="text-base font-bold text-[#1E293B] font-outfit">H. Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Clone Architecture', icon: Copy, color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50/50' },
                  { label: 'Export Architecture', icon: FileDown, color: 'text-pink-600', border: 'border-pink-200', bg: 'bg-pink-50/50' },
                  { label: 'Import Architecture', icon: FileUp, color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50/50' },
                  { label: 'Preview Full Layman', icon: Layout, color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50/50' },
                  { label: 'Apply to Domain', icon: Globe, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50/50' },
                  { label: 'Create New Version', icon: History, color: 'text-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50/50' },
                  { label: 'Deactivate', icon: XCircle, color: 'text-rose-600', border: 'border-rose-200', bg: 'bg-rose-50/50' },
                  { label: 'Delete Architecture', icon: Trash2, color: 'text-slate-600', border: 'border-slate-200', bg: 'bg-slate-50/50' },
                ].map((action, i) => (
                  <button 
                    key={i} 
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 ${action.border} ${action.bg} ${action.color} transition-all hover:scale-[1.02] active:scale-95 group text-left shadow-sm`}
                  >
                    <action.icon size={20} className="shrink-0" />
                    <span className="text-sm font-bold leading-tight">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* G. Architecture Governance & Versioning */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-outfit">G. Architecture Governance & Versioning</h3>
          </div>
          <div className="overflow-hidden rounded-xl border-t border-white/60 bg-white/80 backdrop-blur shadow-2xl -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
            <table className="w-full text-left border-collapse text-sm font-medium text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">Version</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">Changes</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">Updated By</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">Updated At</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { v: 'v2.1 (Current)', changes: 'Added Scenario Pack + Improved Flow', user: 'Super Admin', date: 'May 24, 2025 11:20 AM', status: 'Active', isCurrent: true },
                  { v: 'v2.0', changes: 'Added Visual Metaphor Pack', user: 'Super Admin', date: 'May 15, 2025 09:40 AM', status: 'Archived' },
                  { v: 'v1.0', changes: 'Initial Architecture', user: 'Super Admin', date: 'Apr 28, 2025 10:10 AM', status: 'Archived' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-6 py-4 font-bold ${row.isCurrent ? 'text-pink-600' : 'text-slate-400'}`}>{row.v}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{row.changes}</td>
                    <td className="px-6 py-4">{row.user}</td>
                    <td className="px-6 py-4">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-slate-400">
                        <button className="hover:text-pink-600"><Eye size={14} /></button>
                        <button className="hover:text-slate-900"><Download size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* Bottom Info Bars */}
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
          <Brain size={20} className="text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-800 leading-relaxed">
            This Educational Architecture system ensures universal beginner psychology is maintained while giving flexibility to adapt to any domain's unique teaching style.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
          <ShieldCheck size={20} className="text-blue-500 shrink-0" />
          <p className="text-sm font-bold text-blue-800 leading-relaxed">
            All changes are version controlled and audited for quality and consistency. Last audit pass: 100% compliance.
          </p>
        </div>
      </div>

    </div>
  );
}
