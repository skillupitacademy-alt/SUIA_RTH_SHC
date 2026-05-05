"use client";

import React, { useState, useEffect, useContext } from 'react';
import { ShellContext } from '../../ShellContext';
import {
  ChevronDown, Info, CheckCircle2, Download, Layers,
  Grid, Globe, Calendar, Layout, Zap, Brain, Edit2, Palette,
  RotateCcw, Code, ShieldCheck, Activity, Users, Settings,
  ArrowRight, FileJson, CheckSquare, ExternalLink, Plus, FileText, History,
  MonitorSmartphone, Type, Paintbrush, GripVertical, ListOrdered, Copy, Archive,
  ChevronRight, Eye
} from 'lucide-react';

// Import the JSON data
import allSectionsData from '../../../../data/AllSectionTutorialPage.json';

const formatTitle = (str: string) => {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').replace(' Architecture', '').replace(' Uiux', '');
};

const getIconForComponent = (index: number) => {
  const icons = [Layout, Zap, Brain, Edit2, Layers, Palette, Info, RotateCcw];
  return icons[index % icons.length];
};

const getColorForComponent = (index: number) => {
  const colors = [
    { bg: 'bg-indigo-100', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
    { bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-700' },
    { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' },
    { bg: 'bg-pink-100', text: 'text-pink-600', badge: 'bg-pink-50 text-pink-700' },
    { bg: 'bg-teal-100', text: 'text-teal-600', badge: 'bg-teal-50 text-teal-700' },
    { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-50 text-purple-700' },
    { bg: 'bg-rose-100', text: 'text-rose-600', badge: 'bg-rose-50 text-rose-700' },
  ];
  return colors[index % colors.length];
};

export default function GlobalArchitecturePage() {
  const { setHeaderTitle, setHeaderSubtitle } = useContext(ShellContext);
  
  const architectures = React.useMemo(() => {
    return (allSectionsData as any[]).reduce((acc: any, curr: any) => {
      const key = Object.keys(curr)[0];
      if (key && !acc[key]) {
        acc[key] = curr[key];
      }
      return acc;
    }, {});
  }, []);

  const sectionKeys = Object.keys(architectures);
  const eduKeys = sectionKeys.filter(k => !k.includes('uiux'));
  const uiuxKeys = sectionKeys.filter(k => k.includes('uiux'));

  const [activeSectionKey, setActiveSectionKey] = useState(eduKeys[0]);
  const [isEduDropdownOpen, setIsEduDropdownOpen] = useState(false);
  const [isUiuxDropdownOpen, setIsUiuxDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Universal Architecture');

  useEffect(() => {
    setHeaderTitle('');
    setHeaderSubtitle('');
  }, []);

  const activeData = architectures[activeSectionKey];
  if (!activeData) return <div className="p-10 font-bold text-slate-500">Loading Architecture...</div>;

  const isUiUxMode = activeSectionKey.includes('uiux');
  const universalComponents = isUiUxMode ? [] : Object.entries(activeData.universal_architecture_fixed || {});
  const totalComponents = isUiUxMode ? Object.keys(activeData.component_design_system || {}).length : universalComponents.length;
  const jsonString = JSON.stringify({ [activeSectionKey]: activeData }, null, 2);

  const tabs = [
    'Universal Architecture', 'Section Sequence', 'Component Details', 
    'Learning Progression', 'Prompt Management', 'Renderer Mapping', 'Validation Rules', 'JSON Schema'
  ];



  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* 1. Page Title & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {isUiUxMode ? <Palette className="text-pink-600" size={28} /> : <Layout className="text-indigo-600" size={28} />}
            {isUiUxMode ? 'UI/UX Architecture - ' : 'Universal Architecture - '} {formatTitle(activeSectionKey)}
            <CheckCircle2 className="text-emerald-500" size={24} />
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Constitutional {isUiUxMode ? 'design system' : 'educational architecture'} for {formatTitle(activeSectionKey)} across all domains and brands
          </p>
        </div>
        <button className="flex items-center gap-2 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
          <Download size={16} />
          Export Architecture
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Educational Section Dropdown Card */}
        <div 
          className={`bg-white border ${!isUiUxMode ? 'border-indigo-300 shadow-md ring-2 ring-indigo-50' : 'border-slate-200 shadow-sm'} rounded-xl p-4 flex items-center gap-3 relative cursor-pointer transition-all`} 
          onClick={(e) => { e.stopPropagation(); setIsEduDropdownOpen(!isEduDropdownOpen); setIsUiuxDropdownOpen(false); }}
        >
          <div className={`w-10 h-10 rounded-full ${!isUiUxMode ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center shrink-0 transition-colors`}>
            <Layers size={20} />
          </div>
          <div className="overflow-hidden w-full">
            <span className={`block text-[10px] font-bold ${!isUiUxMode ? 'text-indigo-600' : 'text-slate-400'} uppercase tracking-wider`}>Educational Arch</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm truncate">{!isUiUxMode ? formatTitle(activeSectionKey) : 'Select Schema'}</span>
              <ChevronDown size={14} className="text-slate-400 ml-1 shrink-0" />
            </div>
          </div>
          {isEduDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setIsEduDropdownOpen(false); }} />
              <div className="absolute top-full left-0 mt-2 w-[250px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {eduKeys.map((key) => (
                  <div 
                    key={key}
                    onClick={(e) => { e.stopPropagation(); setActiveSectionKey(key); setIsEduDropdownOpen(false); }}
                    className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors relative z-50 ${activeSectionKey === key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {formatTitle(key)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* UI/UX Section Dropdown Card (Replaces Brand Scope) */}
        <div 
          className={`bg-white border ${isUiUxMode ? 'border-pink-300 shadow-md ring-2 ring-pink-50' : 'border-slate-200 shadow-sm'} rounded-xl p-4 flex items-center gap-3 relative cursor-pointer transition-all`} 
          onClick={(e) => { e.stopPropagation(); setIsUiuxDropdownOpen(!isUiuxDropdownOpen); setIsEduDropdownOpen(false); }}
        >
          <div className={`w-10 h-10 rounded-full ${isUiUxMode ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600'} flex items-center justify-center shrink-0 transition-colors`}>
            <Palette size={20} />
          </div>
          <div className="overflow-hidden w-full">
            <span className={`block text-[10px] font-bold ${isUiUxMode ? 'text-pink-600' : 'text-slate-400'} uppercase tracking-wider`}>UI/UX Arch</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm truncate">{isUiUxMode ? formatTitle(activeSectionKey) : 'Select Schema'}</span>
              <ChevronDown size={14} className="text-slate-400 ml-1 shrink-0" />
            </div>
          </div>
          {isUiuxDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setIsUiuxDropdownOpen(false); }} />
              <div className="absolute top-full left-0 mt-2 w-[250px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {uiuxKeys.map((key) => (
                  <div 
                    key={key}
                    onClick={(e) => { e.stopPropagation(); setActiveSectionKey(key); setIsUiuxDropdownOpen(false); }}
                    className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors relative z-50 ${activeSectionKey === key ? 'bg-pink-50 text-pink-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {formatTitle(key)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</span>
            <span className="font-bold text-slate-800 text-sm">{activeData.metadata?.version || '1.0'} <span className="text-emerald-500 text-xs font-medium">(Active)</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Grid size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUiUxMode ? 'UI Components' : 'Total Components'}</span>
            <span className="font-bold text-slate-800 text-sm">{totalComponents} <span className="text-blue-500 text-xs font-medium">(Fixed)</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Globe size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supported Domains</span>
            <span className="font-bold text-slate-800 text-sm">{activeData.metadata?.supported_domains?.length || 7} Domains</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</span>
            <span className="font-bold text-slate-800 text-sm">May 25, 2026</span>
          </div>
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <div className="border-b border-slate-200 flex overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. Main Content Grid */}
      {activeTab === 'Universal Architecture' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN (65%) */}
          <div className="xl:col-span-8 space-y-6">
            
            {!isUiUxMode ? (
              // ==========================================
              // EDUCATIONAL ARCHITECTURE VIEW
              // ==========================================
              <>
                {/* Architecture Grid */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-base font-bold text-slate-900">Constitutional Section Architecture (Fixed)</h2>
                    <Info size={16} className="text-slate-400" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {universalComponents.map(([key, item]: [string, any], index) => {
                      const Icon = getIconForComponent(index);
                      const color = getColorForComponent(index);
                      return (
                        <div key={key} className="border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center relative hover:shadow-md transition-shadow bg-white">
                          <span className={`absolute top-2 left-2 w-6 h-6 rounded bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center`}>
                            {index + 1}
                          </span>
                          <div className={`w-12 h-12 rounded-full ${color.bg} ${color.text} flex items-center justify-center mb-3 mt-2`}>
                            <Icon size={24} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">{formatTitle(key)}</h3>
                          <p className="text-[10px] text-slate-500 font-medium mb-4 flex-1 line-clamp-2">
                            {item.purpose || "Core architectural component for this section"}
                          </p>
                          <div className="flex items-center gap-2 w-full justify-center">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-100">
                              {item.required !== false ? 'Required' : 'Optional'}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border border-slate-100 ${color.badge}`}>
                              {item.renderer || 'default_card'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section Sequence Flow */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-base font-bold text-slate-900">Default Learning Flow / Section Sequence</h2>
                    <Info size={16} className="text-slate-400" />
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-y-4 px-2">
                    {universalComponents.map(([key, item]: [string, any], index) => {
                      const isLast = index === universalComponents.length - 1;
                      const color = getColorForComponent(index);
                      return (
                        <React.Fragment key={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full ${color.bg} ${color.text} text-[10px] font-bold flex items-center justify-center`}>
                              {index + 1}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{formatTitle(key)}</span>
                          </div>
                          {!isLast && (
                            <div className="mx-2 text-slate-300">
                              <ArrowRight size={14} />
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>

                  <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      This sequence is constitutional and fixed for all domains. Content, examples and depth may vary by domain adaptation rules, but the structural progression remains strictly enforced.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // ==========================================
              // UI/UX ARCHITECTURE VIEW
              // ==========================================
              <>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Component Design System</h2>
                      <Info size={16} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">{totalComponents} Components Registered</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(activeData.component_design_system || {}).map(([key, item]: [string, any], index) => {
                      const color = getColorForComponent(index);
                      return (
                        <div key={key} className="border border-slate-200 rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow bg-slate-50/50">
                          <h3 className="text-sm font-bold text-slate-900 mb-1">{formatTitle(key)}</h3>
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 ${color.bg} ${color.text}`}>
                              {item.style_variant || 'primary'}
                            </span>
                            {item.animation_type && (
                               <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-600">
                                {item.animation_type}
                              </span>
                            )}
                          </div>
                          <div className="mt-auto pt-3 border-t border-slate-200">
                            <span className="block text-[10px] text-slate-500 font-medium mb-1">Permitted Interactive Elements:</span>
                            <div className="flex flex-wrap gap-1">
                               {(item.interactive_elements || ['click', 'hover']).map((el: string) => (
                                 <span key={el} className="text-[8px] font-bold uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{el}</span>
                               ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Type size={16} className="text-indigo-600" /> Color & Typography
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Primary Palette</span>
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded bg-slate-900 shadow-sm"></div>
                            <div className="w-8 h-8 rounded bg-indigo-600 shadow-sm"></div>
                            <div className="w-8 h-8 rounded bg-pink-500 shadow-sm"></div>
                            <div className="w-8 h-8 rounded bg-emerald-500 shadow-sm"></div>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                           <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Font Family</span>
                           <span className="font-mono text-sm text-slate-800">Inter, system-ui, sans-serif</span>
                        </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MonitorSmartphone size={16} className="text-orange-600" /> Universal Layout System
                      </h2>
                      <div className="space-y-2">
                        {Object.entries(activeData.universal_layout_system || {}).slice(0,4).map(([key, value]) => (
                           <div key={key} className="flex justify-between items-center p-2 border-b border-slate-100 last:border-0">
                             <span className="text-xs font-bold text-slate-700">{formatTitle(key)}</span>
                             <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-bold uppercase">{String(value)}</span>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
              </>
            )}

            {/* Governance Activity Table (Shared across both modes) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                 <h2 className="text-base font-bold text-slate-900">Recent Architecture Governance Activity</h2>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">By / Role</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold">{isUiUxMode ? 'UI Rules updated' : 'Architecture updated'}</td>
                    <td className="px-6 py-4 text-slate-500">{formatTitle(activeSectionKey)}</td>
                    <td className="px-6 py-4">1.0</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">SA</div>
                        Super Admin
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">May 25, 2026 10:30 AM</td>
                    <td className="px-6 py-4 text-right"><span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">Published</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* RIGHT COLUMN (35%) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* JSON Viewer */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code size={16} className="text-blue-600" />
                  {isUiUxMode ? 'UI/UX JSON ' : 'Architecture JSON '} <span className="text-slate-400 font-medium">(Read Only)</span>
                </h2>
                <button className="text-[10px] font-bold text-blue-600 border border-blue-100 px-2 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1">
                  View Full JSON <ExternalLink size={12} />
                </button>
              </div>
              <div className="bg-[#0f172a] rounded-xl p-4 overflow-hidden relative">
                <pre className="text-emerald-400 text-[10px] font-mono leading-relaxed overflow-y-auto h-[220px] custom-scrollbar">
                  {jsonString}
                </pre>
              </div>
            </div>

            {/* Validation & Component Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Validation Compliance */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare size={16} className="text-emerald-600" />
                    Validation Compliance
                  </h2>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Overall Score</span>
                    <span className="text-lg font-black text-slate-900">95 <span className="text-[10px] text-slate-400 font-bold">/ 100</span></span>
                  </div>
                </div>
                <div className="space-y-3">
                   {[
                     { label: isUiUxMode ? 'Accessibility Score' : 'Readability Threshold', score: 92 },
                     { label: isUiUxMode ? 'Contrast Ratio' : 'Analogy Quality Score', score: 93 },
                     { label: isUiUxMode ? 'Responsive Check' : 'Confusion Prevention', score: 94 },
                   ].map((metric, i) => (
                     <div key={i} className="flex items-center justify-between">
                       <span className="text-[11px] font-bold text-slate-600">{metric.label}</span>
                       <div className="flex items-center gap-2">
                         <CheckCircle2 size={12} className="text-emerald-500" />
                         <span className="text-xs font-bold text-slate-900">{metric.score} <span className="text-slate-400 text-[9px]">/100</span></span>
                       </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Component Status Donut */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center">
                 <div className="w-full flex items-center gap-2 mb-2">
                   <Grid size={16} className="text-slate-500" />
                   <h2 className="text-sm font-bold text-slate-900">{isUiUxMode ? 'Design System' : 'Component Status'}</h2>
                 </div>
                 
                 <div className="relative w-24 h-24 my-4 flex items-center justify-center rounded-full" style={{ background: 'conic-gradient(#10b981 100%, #e2e8f0 0)'}}>
                    <div className="absolute w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center">
                       <span className="text-xl font-black text-slate-900 leading-none">{totalComponents}</span>
                       <span className="text-[9px] font-bold text-slate-500 uppercase">{isUiUxMode ? 'Tokens' : 'Total'}</span>
                    </div>
                 </div>

                 <div className="w-full space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {isUiUxMode ? 'Mapped' : 'Required'}</span>
                      <span>{totalComponents} (100%)</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {isUiUxMode ? 'Missing' : 'Optional'}</span>
                      <span>0 (0%)</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* CMS & Version Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                 <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <Layers size={14} /> {isUiUxMode ? 'Design Token DB' : 'CMS Integration'}
                 </h2>
                 <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between text-slate-600"><span>{isUiUxMode ? 'Synced' : 'AI Drafts'}</span> <span className="text-slate-900">12</span></div>
                    <div className="flex justify-between text-slate-600"><span>Published</span> <span className="text-slate-900">247</span></div>
                 </div>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                 <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <History size={14} /> Version Governance
                 </h2>
                 <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between text-slate-600"><span>Last Published</span> <span className="text-slate-900">May 20</span></div>
                    <div className="flex justify-between text-slate-600"><span>Next Review</span> <span className="text-slate-900">Jun 20</span></div>
                 </div>
               </div>
            </div>

            {/* Quick Actions List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Zap size={16} className="text-rose-500" /> Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600"><Plus size={12}/></div>
                   {isUiUxMode ? 'Create New Variant' : 'Create New Topic'}
                </button>
                <button className="w-full flex items-center gap-3 p-2.5 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600"><Globe size={12}/></div>
                   {isUiUxMode ? 'Edit Theme Variables' : 'Add Domain Adaptation'}
                </button>
                 <button className="w-full flex items-center gap-3 p-2.5 text-sm font-bold text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-amber-100 group-hover:text-amber-600"><FileText size={12}/></div>
                   {isUiUxMode ? 'Export CSS Tokens' : 'New Prompt Template'}
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : activeTab === 'Section Sequence' && !isUiUxMode ? (
        <div className="space-y-6">
           
           {/* Top 3 Columns */}
           <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-6">
              
              {/* Col 1: Universal Section Sequence */}
              <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px]">
                 <h2 className="text-base font-bold text-slate-900 mb-4">1. Universal Section Sequence (Fixed Order)</h2>
                 <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-lg text-xs font-bold mb-4 flex gap-2 items-center shrink-0">
                    <Info size={14} className="shrink-0 text-blue-500" />
                    This is the fixed universal flow order for all {formatTitle(activeSectionKey)} content.
                 </div>
                 
                 <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                   {((activeData.learning_progression_engine && activeData.learning_progression_engine[0]?.default_flow) || Object.keys(activeData.universal_architecture_fixed || {})).map((key: string, index: number) => {
                     const Icon = getIconForComponent(index);
                     const componentData = activeData.universal_architecture_fixed?.[key] || {};
                     return (
                       <div key={key} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 shadow-sm transition-all group cursor-pointer">
                         <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black shrink-0">
                           {index + 1}
                         </div>
                         <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                           <Icon size={14} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <h3 className="text-xs font-bold text-slate-900 truncate">{formatTitle(key)}</h3>
                           <p className="text-[9px] font-medium text-slate-500 truncate">{componentData.purpose || 'Executes step'}</p>
                         </div>
                         <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0 border border-emerald-100">Required</span>
                         <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500 cursor-grab shrink-0" />
                       </div>
                     )
                   })}
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3 shrink-0">
                   <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-rose-200 text-rose-600 bg-rose-50/50 text-xs font-bold hover:bg-rose-50 transition-colors">
                     <ListOrdered size={14} /> Reorder Sequence
                   </button>
                   <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                     <RotateCcw size={14} /> Reset to Default
                   </button>
                 </div>
                 <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-500 shrink-0">
                    <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={12}/> Fixed Order</span>
                    <span className="flex items-center gap-1.5"><GripVertical size={12}/> Drag to reorder (Admin Only)</span>
                 </div>
              </div>

              {/* Col 2: JSON Architecture */}
              <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px]">
                 <div className="flex items-center justify-between mb-4">
                   <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">2. Section Sequence Architecture (JSON) <Info size={14} className="text-slate-400"/></h2>
                   <button className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                     <Copy size={12} /> Copy JSON
                   </button>
                 </div>
                 <div className="bg-[#0f172a] rounded-xl p-4 flex-1 overflow-hidden relative shadow-inner">
                    <pre className="text-[#38bdf8] text-[10px] font-mono leading-relaxed overflow-y-auto h-full custom-scrollbar">
{`{
  "section_sequence_architecture": {
    "version": "${activeData.metadata?.version || '1.0'}",
    "status": "active",
    "updated_at": "2025-05-15T10:30:00Z",
    "sequence": [
${(((activeData.learning_progression_engine && activeData.learning_progression_engine[0]?.default_flow) || Object.keys(activeData.universal_architecture_fixed || {}))).map((key: string, index: number) => `      {
        "order": ${index + 1},
        "type": "${key}",
        "title": "${formatTitle(key)}",
        "required": true
      }`).join(',\n')}
    ]
  }
}`}
                    </pre>
                 </div>
                 <div className="mt-4 shrink-0">
                   <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                     <Download size={14} /> Export JSON
                   </button>
                 </div>
              </div>

              {/* Col 3: Stacked Panels */}
              <div className="xl:col-span-4 space-y-6 flex flex-col h-[650px]">
                 {/* Progression Flow */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">3. Sequence Progression Flow <Info size={14} className="text-slate-400"/></h2>
                    <div className="flex items-center justify-between mb-8 px-2 overflow-x-auto hide-scrollbar">
                       {(((activeData.learning_progression_engine && activeData.learning_progression_engine[0]?.default_flow) || Object.keys(activeData.universal_architecture_fixed || {}))).slice(0,8).map((key: string, index: number) => {
                         const isLast = index === Math.min(Object.keys(activeData.universal_architecture_fixed || {}).length, 8) - 1;
                         const color = getColorForComponent(index);
                         const Icon = getIconForComponent(index);
                         return (
                           <React.Fragment key={key}>
                             <div className="flex flex-col items-center gap-2 shrink-0">
                               <span className={`text-[10px] font-bold ${color.text}`}>{index + 1}</span>
                               <div className={`w-8 h-8 rounded-full ${color.text} ${color.bg} shadow-sm border border-white flex items-center justify-center`}>
                                 <Icon size={14} />
                               </div>
                             </div>
                             {!isLast && <div className="text-slate-300 shrink-0"><ArrowRight size={12}/></div>}
                           </React.Fragment>
                         )
                       })}
                    </div>
                    <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 flex-1">
                       <h3 className="text-sm font-bold text-purple-900 mb-2">Learner Journey Flow</h3>
                       <p className="text-[11px] text-purple-700 font-medium mb-4 leading-relaxed">This sequence ensures a structured learning experience from basic understanding to summary and revision.</p>
                       <ul className="space-y-2">
                         <li className="flex items-center gap-2 text-xs text-purple-900 font-bold"><CheckCircle2 size={14} className="text-emerald-500"/> Builds concept step-by-step</li>
                         <li className="flex items-center gap-2 text-xs text-purple-900 font-bold"><CheckCircle2 size={14} className="text-emerald-500"/> Enhances retention and understanding</li>
                         <li className="flex items-center gap-2 text-xs text-purple-900 font-bold"><CheckCircle2 size={14} className="text-emerald-500"/> Reduces cognitive overload</li>
                         <li className="flex items-center gap-2 text-xs text-purple-900 font-bold"><CheckCircle2 size={14} className="text-emerald-500"/> Improves confidence and clarity</li>
                       </ul>
                    </div>
                 </div>

                 {/* Governance */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 shrink-0">
                    <h2 className="text-base font-bold text-slate-900 mb-5">4. Architecture Governance</h2>
                    <div className="flex flex-col sm:flex-row gap-6">
                       <div className="flex-1 space-y-3 text-[10px]">
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Created By</span><span className="font-bold text-slate-800">Super Admin</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Created At</span><span className="font-bold text-slate-800">01 May 2026, 09:15 AM</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Last Updated By</span><span className="font-bold text-slate-800">Super Admin</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Last Updated At</span><span className="font-bold text-slate-800">15 May 2026, 10:30 AM</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500 font-medium uppercase tracking-wider">Approval Status</span><span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Published</span></div>
                         <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100"><span className="text-slate-500 font-medium uppercase tracking-wider">Change History</span><span className="font-bold text-indigo-600 flex items-center gap-1 cursor-pointer hover:underline">View History <ArrowRight size={10}/></span></div>
                       </div>
                       <div className="sm:w-[150px] space-y-2 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-6 pt-4 sm:pt-0">
                         <span className="block text-[10px] font-bold text-slate-900 mb-3 uppercase tracking-wider">Governance Actions</span>
                         <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-100 text-rose-600 bg-white text-[10px] font-bold hover:bg-rose-50 transition-colors shadow-sm"><Edit2 size={12}/> Edit Sequence</button>
                         <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-100 text-blue-600 bg-white text-[10px] font-bold hover:bg-blue-50 transition-colors shadow-sm"><History size={12}/> Version History</button>
                         <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-100 text-emerald-600 bg-white text-[10px] font-bold hover:bg-emerald-50 transition-colors shadow-sm"><CheckCircle2 size={12}/> Approve Changes</button>
                         <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-100 text-rose-600 bg-white text-[10px] font-bold hover:bg-rose-50 transition-colors shadow-sm"><Archive size={12}/> Archive Architecture</button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Bottom Content Rows */}
           {/* Domain Adaptation Overview */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                 <div>
                   <h2 className="text-base font-bold text-slate-900">8. Domain Adaptation Overview</h2>
                   <p className="text-xs text-slate-500 font-medium mt-1">This sequence is universal. Domains may provide content adaptation inside each section, not sequence change.</p>
                 </div>
                 <button className="text-[11px] font-bold border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">Manage Domain Adaptations</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                 {activeData.metadata?.supported_domains?.map((domain: string, i: number) => {
                   const icons = [Code, Globe, ShieldCheck, Brain, Activity, Users, Settings];
                   const DomainIcon = icons[i % icons.length];
                   const colors = ['text-purple-600', 'text-blue-500', 'text-slate-800', 'text-rose-500', 'text-emerald-500', 'text-indigo-600', 'text-teal-500'];
                   const colorClass = colors[i % colors.length];
                   return (
                     <div key={domain} className="flex items-center justify-center gap-3 px-6 py-3 border border-slate-200 rounded-xl min-w-[180px] bg-white shadow-sm">
                       <DomainIcon size={20} className={colorClass} />
                       <div>
                         <span className="block text-xs font-bold text-slate-800">{formatTitle(domain)}</span>
                         <span className="text-[10px] font-bold text-emerald-600">Active</span>
                       </div>
                     </div>
                   );
                 }) || (
                    <div className="text-sm text-slate-500 p-4">No specific domain adaptations found.</div>
                 )}
              </div>
           </div>
           
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-base font-bold text-slate-900">9. Recent Architecture Change Log</h2>
                   <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 cursor-pointer hover:underline">View All Changes <ArrowRight size={12}/></span>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Version</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Changed By</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Change Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Changed At</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900">CHG-0587</td>
                        <td className="px-4 py-4">1.0</td>
                        <td className="px-4 py-4">Super Admin</td>
                        <td className="px-4 py-4">Create</td>
                        <td className="px-4 py-4">Initial architecture created</td>
                        <td className="px-4 py-4 text-slate-500">01 May 2026, 09:15 AM</td>
                        <td className="px-4 py-4"><span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold text-[10px]">Published</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900">CHG-0612</td>
                        <td className="px-4 py-4">1.1</td>
                        <td className="px-4 py-4">Super Admin</td>
                        <td className="px-4 py-4">Update</td>
                        <td className="px-4 py-4">Updated step titles and descriptions</td>
                        <td className="px-4 py-4 text-slate-500">06 May 2026, 04:20 PM</td>
                        <td className="px-4 py-4"><span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold text-[10px]">Approved</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900">CHG-0620</td>
                        <td className="px-4 py-4">1.2</td>
                        <td className="px-4 py-4">Super Admin</td>
                        <td className="px-4 py-4">Update</td>
                        <td className="px-4 py-4">Added progression flow and validation rules</td>
                        <td className="px-4 py-4 text-slate-500">15 May 2026, 10:30 AM</td>
                        <td className="px-4 py-4"><span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold text-[10px]">Published</span></td>
                      </tr>
                    </tbody>
                  </table>
                 </div>
              </div>
              <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center">
                 <h2 className="text-base font-bold text-slate-900 mb-6">10. Quick Actions</h2>
                 <div className="space-y-4">
                   <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-purple-200 hover:shadow-md cursor-pointer transition-all group bg-white">
                     <div className="w-10 h-10 rounded bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors"><FileText size={20}/></div>
                     <div><span className="block text-sm font-bold text-purple-700">Create New Section</span><span className="text-xs text-slate-500 font-medium">Start new notes section</span></div>
                   </div>
                   <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all group bg-white">
                     <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors"><ShieldCheck size={20}/></div>
                     <div><span className="block text-sm font-bold text-emerald-700">Create Prompt Template</span><span className="text-xs text-slate-500 font-medium">Build new prompt template</span></div>
                   </div>
                 </div>
              </div>
           </div>

        </div>
      ) : activeTab === 'Component Details' && !isUiUxMode ? (
        <div className="space-y-6">
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column */}
              <div className="xl:col-span-8 space-y-6">
                 
                 {/* 1. Fixed Component Architecture */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                       <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">1. Fixed Component Architecture ({totalComponents}/{totalComponents} Required) <Info size={14} className="text-slate-400"/></h2>
                       <button className="text-[10px] font-bold text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1.5 transition-colors">
                         <ChevronRight size={12} className="rotate-0"/> Manage Order
                       </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(activeData.universal_architecture_fixed || {}).map(([key, item]: [string, any], index) => {
                        const Icon = getIconForComponent(index);
                        const color = getColorForComponent(index);
                        return (
                          <div key={key} className="border border-slate-100 rounded-xl p-4 flex flex-col relative hover:shadow-md transition-shadow bg-white">
                             <div className="flex justify-between items-start mb-2">
                               <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                               <GripVertical size={14} className="text-slate-300 cursor-grab hover:text-slate-500" />
                             </div>
                             <div className="flex flex-col items-center text-center mb-4">
                               <div className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center mb-2`}>
                                 <Icon size={16} />
                               </div>
                               <h3 className="text-xs font-bold text-slate-900 mb-1 leading-tight">{formatTitle(key)}</h3>
                               <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">{item.purpose || 'Basic understanding of the topic in simplest terms.'}</p>
                             </div>
                             <div className="mt-auto space-y-2">
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 bg-slate-50 p-1.5 rounded justify-center border border-slate-100">
                                  <span>Renderer:</span>
                                  <span className={`px-1.5 py-0.5 rounded bg-white border border-slate-200 ${color.text}`}>{item.renderer || 'default'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-bold px-1">
                                  <span className={item.required !== false ? "text-emerald-600" : "text-slate-400"}>{item.required !== false ? 'Required' : 'Optional'}</span>
                                  <span className="text-emerald-600">Active</span>
                                </div>
                             </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-[10px] font-bold text-slate-500">
                       <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Required Component</span>
                       <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Optional Component</span>
                       <span className="flex items-center gap-1.5 ml-auto"><GripVertical size={12}/> Drag to reorder components</span>
                    </div>
                 </div>

                 {/* 4. Renderer Mapping Configuration */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">4. Renderer Mapping Configuration <Info size={14} className="text-slate-400"/></h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-slate-100">
                          <tr>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Component</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Renderer</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Layout Type</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Interaction</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Mobile Support</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Status</th>
                            <th className="py-2 text-[10px] font-bold text-slate-800">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[10px] font-medium text-slate-600">
                          {Object.entries(activeData.universal_architecture_fixed || {}).slice(0, 8).map(([key, item]: [string, any], index) => {
                             const color = getColorForComponent(index);
                             const interactions = ['Static + Icons', 'Visual + Text', 'Icon + Points', 'Hover + Cards', 'Expand/Collapse', 'Zoom + Pan', 'Expand/Collapse', 'Highlights'];
                             const layouts = ['Card', 'Card', 'Card', 'Grid', 'Accordion', 'Diagram', 'FAQ', 'Card'];
                             return (
                               <tr key={key} className="hover:bg-slate-50 transition-colors">
                                 <td className="py-2.5 font-bold text-slate-800">{formatTitle(key)}</td>
                                 <td className="py-2.5"><span className={`${color.text} font-bold`}>{item.renderer || 'default'}</span></td>
                                 <td className="py-2.5">{layouts[index % layouts.length]}</td>
                                 <td className="py-2.5">{interactions[index % interactions.length]}</td>
                                 <td className="py-2.5"><span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 size={10}/> Responsive</span></td>
                                 <td className="py-2.5"><span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 size={10}/> Active</span></td>
                                 <td className="py-2.5">
                                   <div className="flex gap-2 text-indigo-500">
                                     <Edit2 size={12} className="cursor-pointer hover:text-indigo-700"/>
                                     <Eye size={12} className="cursor-pointer hover:text-indigo-700"/>
                                   </div>
                                 </td>
                               </tr>
                             )
                          })}
                        </tbody>
                      </table>
                    </div>
                 </div>

                 {/* 8. Prompt Management Overview */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">8. Prompt Management Overview <Info size={14} className="text-slate-400"/></h2>
                    <button className="absolute top-6 right-6 border border-rose-200 text-rose-600 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-rose-50 transition-colors">Manage Prompts <ArrowRight size={10}/></button>
                    
                    <div className="flex gap-4 mb-6 flex-wrap">
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><FileText size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Prompts</span><span className="text-base font-black text-slate-900">{totalComponents}</span></div>
                       </div>
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Approved Prompts</span><span className="text-base font-black text-slate-900">{totalComponents}</span></div>
                       </div>
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Edit2 size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Draft Prompts</span><span className="text-base font-black text-slate-900">0</span></div>
                       </div>
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShieldCheck size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Prompt Integrity</span><span className="text-xs font-black text-emerald-600">Verified</span></div>
                       </div>
                       <div className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 flex-1 bg-white min-w-[140px] shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Calendar size={14}/></div>
                         <div><span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Last Updated</span><span className="text-xs font-black text-slate-900">15 May 2026</span></div>
                       </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                       <div>
                         <span className="block text-[10px] font-bold text-slate-700 mb-1">Prompt Integrity Hash (SHA256)</span>
                         <span className="text-[10px] font-mono text-slate-500">a4f8c1d9b8e3f7c2a6d9e4b5f1c8a7e2d3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b</span>
                       </div>
                       <button className="border border-indigo-100 text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-indigo-50 transition-colors bg-white"><Copy size={10}/> Copy Hash</button>
                    </div>
                 </div>

              </div>

              {/* Right Column */}
              <div className="xl:col-span-4 space-y-6">
                 
                 {/* 2. JSON */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px]">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">2. Component Architecture JSON <span className="text-slate-400 font-medium">(Read Only)</span></h2>
                    <div className="bg-[#0f172a] rounded-xl p-4 flex-1 overflow-hidden relative shadow-inner">
                      <pre className="text-[#38bdf8] text-[10px] font-mono leading-relaxed overflow-y-auto h-full custom-scrollbar">
{`{
  "section_type": "${activeSectionKey}",
  "version": "${activeData.metadata?.version || '1.0'}",
  "status": "active",
  "components": [
${Object.entries(activeData.universal_architecture_fixed || {}).map(([key, item]: [string, any], index) => `    {
      "key": "${key}",
      "name": "${formatTitle(key)}",
      "required": ${item.required !== false},
      "renderer": "${item.renderer || 'default'}",
      "order": ${index + 1},
      "enabled": ${item.enabled !== false}
    }`).join(',\n')}
  ]
}`}
                      </pre>
                    </div>
                    <div className="mt-4 flex gap-2">
                       <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 py-2 rounded hover:bg-indigo-50 transition-colors"><Copy size={12}/> Copy JSON</button>
                       <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-blue-600 border border-blue-100 py-2 rounded hover:bg-blue-50 transition-colors"><Download size={12}/> Download JSON</button>
                       <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600 border border-slate-200 py-2 rounded hover:bg-slate-50 transition-colors"><CheckSquare size={12}/> Validate JSON</button>
                    </div>
                 </div>

                 {/* 5. Default Learning Progression Flow */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">5. Default Learning Progression Flow <Info size={14} className="text-slate-400"/></h2>
                    <div className="flex items-center justify-between mb-8 overflow-x-auto hide-scrollbar pb-2">
                       {Object.keys(activeData.universal_architecture_fixed || {}).slice(0,8).map((key: string, index: number) => {
                         const color = getColorForComponent(index);
                         const Icon = getIconForComponent(index);
                         const isLast = index === Math.min(Object.keys(activeData.universal_architecture_fixed || {}).length, 8) - 1;
                         return (
                           <React.Fragment key={key}>
                             <div className="flex flex-col items-center gap-1 shrink-0">
                               <span className={`text-[9px] font-bold ${color.text}`}>{index + 1}</span>
                               <div className={`w-7 h-7 rounded-full ${color.bg} ${color.text} flex items-center justify-center shadow-sm border border-white`}>
                                 <Icon size={12} />
                               </div>
                             </div>
                             {!isLast && <div className="text-slate-200 shrink-0"><ArrowRight size={10}/></div>}
                           </React.Fragment>
                         )
                       })}
                    </div>
                    <div className="space-y-4 mb-6">
                       {Object.keys(activeData.universal_architecture_fixed || {}).slice(0,8).map((key: string, index: number) => {
                         const color = getColorForComponent(index);
                         return (
                           <div key={key} className="flex items-center gap-3">
                             <div className={`w-5 h-5 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-[9px] font-bold shrink-0`}>{index + 1}</div>
                             <span className="text-[11px] font-bold text-slate-800">{formatTitle(key)}</span>
                           </div>
                         )
                       })}
                    </div>
                    <button className="w-full border border-purple-200 text-purple-600 bg-purple-50/50 text-xs font-bold py-2.5 rounded-lg hover:bg-purple-50 transition-colors shadow-sm">Edit Progression Flow</button>
                 </div>

                 {/* 9. Section Metadata */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-4">9. Section Metadata</h2>
                    <div className="space-y-4 text-[10px]">
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Description</span><span className="font-medium text-slate-800 leading-snug">Explanation for beginners with simple language and real life analogies.</span></div>
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Target Audience</span><span className="font-medium text-slate-800 leading-snug">Beginners, non-technical learners, career switchers</span></div>
                       <div className="flex items-center"><span className="w-24 shrink-0 text-slate-500">Complexity Level</span><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded">Beginner</span></div>
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Estimated Time</span><span className="font-medium text-slate-800 leading-snug">5 - 10 min per subtopic</span></div>
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Content Objective</span><span className="font-medium text-slate-800 leading-snug">Make complex topics simple, relatable and easy to understand.</span></div>
                       <div className="flex items-start"><span className="w-24 shrink-0 text-slate-500 mt-0.5">Learning Outcome</span><span className="font-medium text-slate-800 leading-snug">Build strong conceptual foundation with confidence.</span></div>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm p-16 flex flex-col items-center justify-center text-center">
           <Info size={48} className="text-slate-300 mb-4" />
           <h2 className="text-xl font-bold text-slate-800 mb-2">{activeTab}</h2>
           <p className="text-sm text-slate-500 max-w-md">
             Detailed mapping for the {activeTab} section has no information in JSON file yet or is currently under development. Please check back later.
           </p>
        </div>
      )}
    </div>
  );
}
