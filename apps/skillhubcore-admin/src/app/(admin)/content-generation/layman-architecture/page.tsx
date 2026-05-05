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
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-orange-200">1</div>
          <h2 className="text-base font-bold text-slate-900 font-outfit">Select Scope</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Domain', value: 'Frontend Development' },
            { label: 'Subject', value: 'JavaScript' },
            { label: 'Topic', value: 'JavaScript Basics' },
            { label: 'Subtopic', value: 'What is JavaScript?' }
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{item.label}</label>
              <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 cursor-pointer hover:border-pink-200 hover:bg-pink-50/10 transition-all">
                <span className="truncate">{item.value}</span>
                <ChevronDown size={16} className="text-slate-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Subtopic ID</span>
            <code className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-100">sub_8f7a2e1c9d3b4a56</code>
            <button className="text-slate-400 hover:text-pink-600 transition-colors" aria-label="Copy ID">
              <Copy size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Step 2: Educational Architecture Management */}
      <section className="bg-white/80 backdrop-blur rounded-xl border-t border-white/60 shadow-2xl p-6 -translate-y-1 hover:-translate-y-3 transition-transform duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-orange-200">2</div>
            <h2 className="text-base font-bold text-slate-900 font-outfit">Educational Architecture Management</h2>
          </div>
          
          <button className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-200 hover:bg-pink-700 transition-all active:scale-95">
            <Plus size={16} />
            New Architecture
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
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
          
          {/* A. Universal Layman Architecture (Left Column) */}
          <div className="col-span-12 xl:col-span-6 space-y-6">
            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-outfit">A. Universal Layman Architecture (Fixed Across All Domains)</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">These components remain the same sequence for every layman section.</p>
                </div>
                <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100">Standard Structure</span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">#</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Component</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Purpose</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Req</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-600">
                    {[
                      { id: 1, name: 'Simple Overview', purpose: 'What this topic is in plain language', icon: Layout, color: 'text-blue-500' },
                      { id: 2, name: 'Everyday Analogy', purpose: 'Connect concept to real life', icon: Zap, color: 'text-orange-500' },
                      { id: 3, name: 'Why It Exists', purpose: 'Why this concept matters', icon: Brain, color: 'text-pink-500' },
                      { id: 4, name: 'Simple Use Cases', purpose: 'Basic practical examples', icon: Edit2, color: 'text-emerald-500' },
                      { id: 5, name: 'Beginner Breakdown', purpose: 'Explain parts simply', icon: Layers, color: 'text-indigo-500' },
                      { id: 6, name: 'Visual Mental Model', purpose: 'Easy imagination aid', icon: Palette, color: 'text-purple-500' },
                      { id: 7, name: 'Common Beginner Confusions', purpose: 'Reduce fear and clear doubts', icon: Info, color: 'text-red-500' },
                      { id: 8, name: 'Simple Recap', purpose: 'Reinforce clarity and summary', icon: RotateCcw, color: 'text-teal-500' },
                    ].map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3 font-bold text-slate-400">{row.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <row.icon size={14} className={row.color} />
                            <span className="font-bold text-slate-700">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic">{row.purpose}</td>
                        <td className="px-4 py-3 text-center">
                          <CheckCircle2 size={14} className="text-emerald-500 mx-auto" />
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-bold">Active</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:text-pink-600"><Edit2 size={12} /></button>
                            <button className="p-1 hover:text-slate-900"><MoreVertical size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[11px] font-bold text-slate-400 hover:border-pink-200 hover:text-pink-500 transition-all flex items-center justify-center gap-2">
                <Plus size={14} />
                Add Custom Universal Component
              </button>

              {/* Architecture Details Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Universal Architecture Details</h4>
                  <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                  {[
                    { label: 'Architecture Name', value: 'Beginner First – Universal Layman Model' },
                    { label: 'Description', value: 'Complete beginner-friendly structure that builds confidence and clarity.' },
                    { label: 'Difficulty Level', value: 'Beginner' },
                    { label: 'Cognitive Load', value: 'Low' },
                    { label: 'Created By', value: 'Super Admin' },
                    { label: 'Updated At', value: 'May 24, 2025 11:20 AM' },
                  ].map((detail, i) => (
                    <React.Fragment key={i}>
                      <span className="font-bold text-slate-400">{detail.label}</span>
                      <span className="font-bold text-slate-700">{detail.value}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (B, C, D, E, F) */}
          <div className="col-span-12 xl:col-span-6 space-y-6">
            
            {/* B. Domain-Specific Adaptations & C. Architecture Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* B. Adaptations */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 font-outfit">B. Domain-Specific Adaptations (Flexible)</h3>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Domain Type</label>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer">
                    <span>Full Stack Development</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Programming Analogy Pack', count: '12 Analogies', icon: Download, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { name: 'Real World Story Pack', count: '8 Stories', icon: Globe, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { name: 'Visual Metaphor Pack', count: '15 Visuals', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { name: 'Beginner Scenario Pack', count: '20 Scenarios', icon: Brain, color: 'text-pink-500', bg: 'bg-pink-50' },
                  ].map((pack, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-pink-200 transition-all cursor-pointer group">
                      <div className={`w-8 h-8 rounded-lg ${pack.bg} flex items-center justify-center ${pack.color}`}>
                        <pack.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{pack.name}</p>
                        <p className="text-[9px] font-medium text-slate-400">{pack.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:text-pink-500 transition-all">
                  + Add New Adaptation Pack
                </button>
              </div>

              {/* C. Architecture Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 font-outfit">C. Architecture Overview</h3>
                  <span className="text-pink-600 font-black text-[10px]">v2.1</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Architecture Name', value: 'Beginner First Universal Model' },
                    { label: 'Applied Domains', value: '9 Domains' },
                    { label: 'Total Components', value: '8 Universal Components' },
                    { label: 'Total Adaptation Packs', value: '6 Packs' },
                    { label: 'Renderer Mappings', value: '18 Mappings' },
                    { label: 'Learner Psychology', value: 'Beginner Confidence Model' },
                    { label: 'Status', value: 'Active', isStatus: true },
                    { label: 'Last Updated', value: 'May 24, 2025 11:20 AM' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-400">{row.label}</span>
                      {row.isStatus ? (
                        <span className="text-emerald-500 font-bold">Active</span>
                      ) : (
                        <span className="font-bold text-slate-700 text-right">{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* D. Learning Flow (Recommended Sequence) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 font-outfit">D. Learning Flow (Recommended Sequence)</h3>
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
                    <div className={`w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white ${step.color}`}>
                      <step.icon size={14} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* E & F Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* E. Renderer Mapping Engine */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 font-outfit">E. Renderer Mapping Engine</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase px-1">
                    <span>Subsection Type</span>
                    <span>Renderer Type</span>
                    <span>Domain Override</span>
                  </div>
                  {[
                    { type: 'Simple Overview', renderer: 'Text + Icon Card', override: 'Default' },
                    { type: 'Everyday Analogy', renderer: 'Analogy Card', override: 'Custom' },
                    { type: 'Why It Exists', renderer: 'Benefit Card', override: 'Default' },
                    { type: 'Simple Use Cases', renderer: 'Use Case Grid', override: 'Custom' },
                    { type: 'Beginner Breakdown', renderer: 'Accordion List', override: 'Default' },
                    { type: 'Visual Mental Model', renderer: 'Diagram / Visual', override: 'Custom' },
                    { type: 'Common Confusions', renderer: 'FAQ / Alert Card', override: 'Default' },
                    { type: 'Simple Recap', renderer: 'Summary Card', override: 'Default' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg text-[10px] font-bold">
                      <span className="text-slate-600">{row.type}</span>
                      <span className="text-slate-900">{row.renderer}</span>
                      <span className={row.override === 'Custom' ? 'text-orange-500' : 'text-emerald-500'}>{row.override}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* F. Beginner Psychology Model */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 font-outfit">F. Beginner Psychology Model</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Fear Reduction', value: 'High', color: 'bg-blue-500' },
                    { label: 'Clarity Focus', value: 'Very High', color: 'bg-emerald-500' },
                    { label: 'Analogy Usage', value: 'High', color: 'bg-orange-500' },
                    { label: 'Real World Connection', value: 'High', color: 'bg-indigo-500' },
                    { label: 'Cognitive Load', value: 'Low', color: 'bg-pink-500' },
                    { label: 'Confidence Building', value: 'Very High', color: 'bg-emerald-500' },
                    { label: 'Step by Step Flow', value: 'Enabled', color: 'bg-teal-500' },
                    { label: 'Encouragement Tone', value: 'Friendly', color: 'bg-purple-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div>
                        <span className="text-slate-600">{item.label}</span>
                      </div>
                      <span className={item.value === 'Low' ? 'text-pink-600' : 'text-emerald-600'}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Domain Preview (Matching Image) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm border-l-4 border-l-pink-500">
              <h4 className="text-xs font-bold text-slate-900">Selected Domain Preview</h4>
              <p className="text-[10px] text-slate-400 font-medium italic">How the layman section will look in this domain.</p>
              
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-[11px] font-bold text-slate-800">Example: Explaining "Variable"</p>
                <div className="space-y-2 text-[10px] leading-relaxed text-slate-600">
                  <p><span className="font-bold text-pink-600 uppercase text-[8px]">Analogy:</span> A variable is like a labeled box where you can store anything.</p>
                  <p><span className="font-bold text-blue-600 uppercase text-[8px]">Real Life:</span> Like a container in your kitchen where you keep sugar.</p>
                  <p><span className="font-bold text-emerald-600 uppercase text-[8px]">Mental Model:</span> Variable = Name + Value</p>
                </div>
                <button className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-orange-500 text-white rounded-lg text-[10px] font-bold shadow-md shadow-pink-100 active:scale-95 transition-all">
                  <PlayCircle size={14} />
                  Preview Full Layman Section
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* G. Architecture Governance & Versioning */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-outfit">G. Architecture Governance & Versioning</h3>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-[11px] font-medium text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Version</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Changes</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Updated By</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Updated At</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
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
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
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

        {/* H. Quick Actions Grid */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-outfit">H. Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Clone Architecture', icon: Copy, color: 'text-purple-600', border: 'border-purple-100', bg: 'bg-purple-50' },
              { label: 'Export Architecture', icon: FileDown, color: 'text-pink-600', border: 'border-pink-100', bg: 'bg-pink-50' },
              { label: 'Import Architecture', icon: FileUp, color: 'text-orange-600', border: 'border-orange-100', bg: 'bg-orange-50' },
              { label: 'Preview Full Layman', icon: Layout, color: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50' },
              { label: 'Apply to Domain', icon: Globe, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50' },
              { label: 'Create New Version', icon: History, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50' },
              { label: 'Deactivate', icon: XCircle, color: 'text-red-600', border: 'border-red-100', bg: 'bg-red-50' },
              { label: 'Delete Architecture', icon: Trash2, color: 'text-slate-600', border: 'border-slate-100', bg: 'bg-slate-50' },
            ].map((action, i) => (
              <button key={i} className={`flex items-center gap-3 p-3 rounded-2xl border bg-white ${action.border} hover:shadow-lg hover:-translate-y-1 transition-all group text-left`}>
                <div className={`w-9 h-9 rounded-xl ${action.bg} ${action.color} flex items-center justify-center shadow-sm`}>
                  <action.icon size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Info Bars */}
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
          <Brain size={18} className="text-amber-500 shrink-0" />
          <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
            This Educational Architecture system ensures universal beginner psychology is maintained while giving flexibility to adapt to any domain's unique teaching style.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
          <ShieldCheck size={18} className="text-blue-500 shrink-0" />
          <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
            All changes are version controlled and audited for quality and consistency. Last audit pass: 100% compliance.
          </p>
        </div>
      </div>

    </div>
  );
}
