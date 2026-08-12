/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from 'react';
import { 
  Settings,
  Globe,
  FileText,
  Edit2,
  MonitorSmartphone,
  Info,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  Copy,
  Download,
  CheckSquare,
  ArrowRight,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import type { LegacyTabCommonProps, ComponentArchitecture } from './types';
import { formatTitle, getIconForComponent, getColorForComponent } from '../utils';

export function ComponentDetailsTab({
  activeSectionKey,
  activeData,
  activeComponentMap,
  activeLearningFlow,
  isUiUxMode,
  selectedComponentKey,
  setSelectedComponentKey,
  selectedComponentData,
  selectedComponentIndex,
  selectedWorkflowUrls,
  adminSectionId,
  canonicalSectionId,
  showAdvancedComponentDetails,
  setShowAdvancedComponentDetails,
  openWorkflowUrl,
  setActiveTab,
  copyArchitectureJson,
  downloadArchitectureJson,
  validateActiveArchitecture,
  showActionMessage,
  selectedRendererMapping,
  totalComponents,
  activeComponentEntries,
  activeComponentKeys
}: LegacyTabCommonProps & {
  setActiveTab: (tab: string) => void;
  validateActiveArchitecture: () => void;
  selectedRendererMapping: Record<string, unknown> | null;
  totalComponents: number;
  activeComponentEntries: Array<[string, ComponentArchitecture]>;
  activeComponentKeys: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Selected {isUiUxMode ? 'UI/UX Component Contract' : 'Component Contract'}</h2>
              <p className="text-sm text-slate-500 mt-1">
                This is the one component currently selected from the fixed {isUiUxMode ? 'UI/UX design system' : 'section architecture'}.
              </p>
            </div>
            <button type="button" onClick={() => setShowAdvancedComponentDetails && setShowAdvancedComponentDetails((value) => !value)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <Settings size={14}/> {showAdvancedComponentDetails ? 'Hide Advanced' : 'Show Advanced'}
            </button>
          </div>

          <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{isUiUxMode ? 'UI/UX Architecture Component' : 'Component'}</span>
            <h3 className="text-3xl font-black text-slate-950 mt-1">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'Select a component'}</h3>
            <p className="mt-2 font-mono text-xs font-black text-indigo-700">{selectedComponentKey || 'full_section'}</p>
            {isUiUxMode ? <p className="mt-2 font-mono text-xs font-black text-pink-700">{String(selectedComponentData?.renderer || selectedComponentData?.component || 'No renderer selected')}</p> : null}
            <p className="text-sm text-slate-700 mt-4 leading-relaxed">{selectedComponentData?.purpose || 'Select a component from Universal Architecture to inspect its contract.'}</p>
          </div>

          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-black text-slate-900">{isUiUxMode ? 'UI/UX Architecture / Renderer Mapping Configuration' : 'Fixed Component Architecture / Renderer Mapping Configuration'}</h3>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
              {isUiUxMode ? 'This tab confirms which learner-facing renderer, layout, style variant, and interaction contract belongs to the selected Notes UI component.' : 'This tab explains the selected component contract. Use Renderer Mapping for UI/UX editing; this tab confirms which fixed education component and renderer are connected.'}
            </p>
          </div>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeComponentEntries.map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedComponentKey(key)}
                className={`rounded-xl border p-3 text-left transition-all ${selectedComponentKey === key ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <p className="text-xs font-black text-slate-900">{formatTitle(key)}</p>
                <p className="mt-1 font-mono text-[10px] font-black text-indigo-700">{String((item as ComponentArchitecture).renderer || (item as ComponentArchitecture).component || 'default_renderer')}</p>
                {isUiUxMode ? <p className="mt-1 text-[10px] font-bold text-slate-500">layout: {String((item as ComponentArchitecture).layout_type || (item as ComponentArchitecture).layout || 'default')}</p> : null}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Renderer</span>
              <p className="text-sm font-black text-slate-900 mt-1">{String(selectedComponentData?.renderer || (selectedRendererMapping as Record<string, unknown> | null)?.component || 'Default renderer')}</p>
              <p className="text-xs text-slate-500 mt-2">This decides which UI component will show the JSON.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Required / Fixed</span>
              <p className="text-sm font-black text-emerald-700 mt-1">{selectedComponentData?.required === false ? 'Optional' : 'Required'}</p>
              <p className="text-xs text-slate-500 mt-2">This section contract should not be changed during normal content work.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Prompt Target</span>
              <p className="text-sm font-black text-slate-900 mt-1">{String(adminSectionId)}{selectedComponentKey ? `.${selectedComponentKey}` : ''}</p>
              <p className="text-xs text-slate-500 mt-2">This is what Prompt Generator and Content Manager receive.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sequence Position</span>
              <p className="text-sm font-black text-slate-900 mt-1">{selectedComponentIndex + 1} of {activeLearningFlow.length}</p>
              <p className="text-xs text-slate-500 mt-2">Use Section Sequence only to inspect the fixed order.</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">What Can You Do Here?</h2>
          <div className="space-y-3">
            <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.visualGuide)} className="w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2">
              <Globe size={16}/> Open Visual Guide for this component
            </button>
            <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)} className="w-full rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-2">
              <FileText size={16}/> Generate Prompt for this component
            </button>
            <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.contentManager)} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700 flex items-center justify-center gap-2">
              <Edit2 size={16}/> Open Content Manager Preview
            </button>
            <button type="button" onClick={() => setActiveTab('Renderer Mapping')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
              <MonitorSmartphone size={16}/> Configure renderer mapping
            </button>
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              The large component grid, raw JSON, prompt statistics, progression list, and metadata are advanced inspection panels. They are hidden by default because they are not needed for normal component workflow.
            </p>
          </div>
        </div>
      </div>

      {showAdvancedComponentDetails ? (
       <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="xl:col-span-8 space-y-6">
             
             {/* 1. Fixed Component Architecture */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">1. Fixed Component Architecture ({totalComponents}/{totalComponents} Required) <Info size={14} className="text-slate-400"/></h2>
                   <button type="button" onClick={() => setActiveTab('Section Sequence')} className="text-[10px] font-bold text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1.5 transition-colors">
                     <ChevronRight size={12} className="rotate-0"/> Manage Order
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {activeComponentEntries.map(([key, item], index) => {
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
                   <span className="flex items-center gap-1.5 ml-auto"><Settings size={12}/> Advanced inspection only</span>
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
                      {activeComponentEntries.slice(0, 8).map(([key, item], index) => {
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
                               <div className="flex flex-wrap gap-2">
                                 <button type="button" onClick={() => { setSelectedComponentKey(key); setActiveTab('Renderer Mapping'); }} className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-[9px] font-black text-indigo-700 hover:bg-indigo-100">
                                   Configure
                                 </button>
                                 <button type="button" onClick={() => openWorkflowUrl(`/tools/visual-guide?section=${canonicalSectionId}&subsection=${key}`)} className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 hover:bg-blue-100">
                                   Visual Guide
                                 </button>
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
                <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)} className="absolute top-6 right-6 border border-rose-200 text-rose-600 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-rose-50 transition-colors">Manage Prompts <ArrowRight size={10}/></button>
                
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
                   <button type="button" onClick={() => { navigator.clipboard.writeText('a4f8c1d9b8e3f7c2a6d9e4b5f1c8a7e2d3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'); showActionMessage('Prompt integrity hash copied.'); }} className="border border-indigo-100 text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-indigo-50 transition-colors bg-white"><Copy size={10}/> Copy Hash</button>
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
${activeComponentEntries.map(([key, item], index) => `    {
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
                   <button type="button" onClick={copyArchitectureJson} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 py-2 rounded hover:bg-indigo-50 transition-colors"><Copy size={12}/> Copy JSON</button>
                   <button type="button" onClick={downloadArchitectureJson} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-blue-600 border border-blue-100 py-2 rounded hover:bg-blue-50 transition-colors"><Download size={12}/> Download JSON</button>
                   <button type="button" onClick={validateActiveArchitecture} className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600 border border-slate-200 py-2 rounded hover:bg-slate-50 transition-colors"><CheckSquare size={12}/> Validate JSON</button>
                </div>
             </div>

             {/* 5. Default Learning Progression Flow */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">5. Default Learning Progression Flow <Info size={14} className="text-slate-400"/></h2>
                <div className="flex items-center justify-between mb-8 overflow-x-auto hide-scrollbar pb-2">
                   {activeComponentKeys.slice(0,8).map((key: string, index: number) => {
                     const color = getColorForComponent(index);
                     const Icon = getIconForComponent(index);
                     const isLast = index === Math.min(activeComponentKeys.length, 8) - 1;
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
                   {activeComponentKeys.slice(0,8).map((key: string, index: number) => {
                     const color = getColorForComponent(index);
                     return (
                       <div key={key} className="flex items-center gap-3">
                         <div className={`w-5 h-5 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-[9px] font-bold shrink-0`}>{index + 1}</div>
                         <span className="text-[11px] font-bold text-slate-800">{formatTitle(key)}</span>
                       </div>
                     )
                   })}
                </div>
                <button type="button" onClick={() => setActiveTab('Section Sequence')} className="w-full border border-purple-200 text-purple-600 bg-purple-50/50 text-xs font-bold py-2.5 rounded-lg hover:bg-purple-50 transition-colors shadow-sm">Edit Progression Flow</button>
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
       ) : null}
    </div>
  );
}
