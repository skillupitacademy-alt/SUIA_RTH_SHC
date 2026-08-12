"use client";

import React from 'react';
import { 
  CheckCircle2, 
  Info, 
  Settings, 
  Globe, 
  FileText, 
  Edit2, 
  Copy, 
  Download, 
  ArrowRight, 
  History, 
  Archive,
  Code,
  ShieldCheck,
  Brain,
  Activity,
  Users
} from 'lucide-react';
import type { LegacyTabCommonProps } from './types';
import { formatTitle, getIconForComponent, getColorForComponent } from '../utils';
import type { ComponentArchitecture } from './types';

export function SectionSequenceTab({
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
  showAdvancedSequence,
  setShowAdvancedSequence,
  startJsonEdit,
  copyArchitectureJson,
  downloadArchitectureJson,
  openWorkflowUrl,
  showActionMessage,
  updateArchitectureStatus
}: LegacyTabCommonProps) {
  return (
    <div className="space-y-6">
       
       {/* Top 3 Columns */}
       <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-6">
          
          {/* Col 1: Universal Section Sequence */}
          <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px]">
             <div className="flex items-start justify-between gap-4 mb-4">
               <div>
                  <h2 className="text-base font-bold text-slate-900">{isUiUxMode ? 'UI/UX Component Sequence / Renderer Order' : 'Universal Section Sequence / Fixed Component Order'}</h2>
                 <p className="text-xs text-slate-500 font-medium mt-1">Select a component to inspect its place in the {isUiUxMode ? 'UI rendering flow' : 'section journey'}.</p>
               </div>
               <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full"><CheckCircle2 size={12}/> Fixed</span>
             </div>
             <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-lg text-xs font-bold mb-4 flex gap-2 items-center shrink-0">
                <Info size={14} className="shrink-0 text-blue-500" />
                This is the fixed {isUiUxMode ? 'UI/UX component rendering order' : 'universal flow order'} for all {formatTitle(activeSectionKey)} content.
             </div>
             
             <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {activeLearningFlow.map((key: string, index: number) => {
                 const Icon = getIconForComponent(index);
                 const componentData = (activeComponentMap[key] || {}) as ComponentArchitecture;
                 return (
                   <button type="button" key={key} onClick={() => setSelectedComponentKey(key)} className={`w-full flex items-center gap-3 p-3 border rounded-xl shadow-sm transition-all group text-left ${selectedComponentKey === key ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                     <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black shrink-0">
                       {index + 1}
                     </div>
                     <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                       <Icon size={14} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 truncate">{formatTitle(key)}</h3>
                        <p className="text-[9px] font-black text-indigo-600 truncate">{key}</p>
                        <p className="text-[9px] font-medium text-slate-500 truncate">{String(componentData.renderer || componentData.component || componentData.purpose || 'Executes step')}</p>
                     </div>
                     <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0 border border-emerald-100">Required</span>
                     {selectedComponentKey === key ? <span className="text-[9px] font-black text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-100">Selected</span> : null}
                   </button>
                 )
               })}
             </div>
             
             <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-slate-500 shrink-0">
                <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={12}/> No action needed unless the constitutional order changes.</span>
                <button type="button" onClick={() => setShowAdvancedSequence && setShowAdvancedSequence((value) => !value)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                  <Settings size={12}/> {showAdvancedSequence ? 'Hide Advanced' : 'Show Advanced'}
                </button>
             </div>
          </div>

          <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-[650px] flex flex-col">
            <h2 className="text-base font-bold text-slate-900 mb-4">Selected Component Journey</h2>
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5 mb-5">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Selected</span>
              <h3 className="text-2xl font-black text-slate-950 mt-1">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'Select a component'}</h3>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{isUiUxMode ? String(selectedComponentData?.renderer || selectedComponentData?.component || 'Select a component to see the renderer and UI contract.') : selectedComponentData?.purpose || 'Select a component on the left to see how it fits in the fixed sequence.'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">Before</span>
                <p className="text-sm font-black text-slate-800 mt-1">{activeLearningFlow[selectedComponentIndex - 1] ? formatTitle(activeLearningFlow[selectedComponentIndex - 1]) : 'Section start'}</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-white p-4">
                <span className="text-[10px] font-black text-indigo-500 uppercase">Position</span>
                <p className="text-sm font-black text-slate-800 mt-1">{selectedComponentIndex + 1} of {activeLearningFlow.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">After</span>
                <p className="text-sm font-black text-slate-800 mt-1">{activeLearningFlow[selectedComponentIndex + 1] ? formatTitle(activeLearningFlow[selectedComponentIndex + 1]) : 'Section end'}</p>
              </div>
            </div>
            <div className="space-y-3 mt-auto">
              <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.visualGuide)} className="w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2"><Globe size={16}/> Open Visual Guide</button>
              <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)} className="w-full rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-2"><FileText size={16}/> Open Prompt Generator</button>
              <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.contentManager)} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700 flex items-center justify-center gap-2"><Edit2 size={16}/> Open Content Manager</button>
            </div>
          </div>

          {showAdvancedSequence ? (
          <>

          {/* Col 2: JSON Architecture */}
          <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px]">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">2. Section Sequence Architecture (JSON) <Info size={14} className="text-slate-400"/></h2>
               <button type="button" onClick={copyArchitectureJson} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
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
${activeLearningFlow.map((key: string, index: number) => `      {
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
               <button type="button" onClick={downloadArchitectureJson} className="flex some items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
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
                    {activeLearningFlow.slice(0,8).map((key: string, index: number) => {
                     const isLast = index === Math.min(activeLearningFlow.length, 8) - 1;
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
                     <button type="button" onClick={startJsonEdit} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-100 text-rose-600 bg-white text-[10px] font-bold hover:bg-rose-50 transition-colors shadow-sm"><Edit2 size={12}/> Edit Sequence</button>
                     <button type="button" onClick={() => showActionMessage('Version history is represented in the change log below.')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-100 text-blue-600 bg-white text-[10px] font-bold hover:bg-blue-50 transition-colors shadow-sm"><History size={12}/> Version History</button>
                     <button type="button" onClick={() => updateArchitectureStatus('approved')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-100 text-emerald-600 bg-white text-[10px] font-bold hover:bg-emerald-50 transition-colors shadow-sm"><CheckCircle2 size={12}/> Approve Changes</button>
                     <button type="button" onClick={() => updateArchitectureStatus('archived')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-100 text-rose-600 bg-white text-[10px] font-bold hover:bg-rose-50 transition-colors shadow-sm"><Archive size={12}/> Archive Architecture</button>
                   </div>
                </div>
             </div>
          </div>
          </>
          ) : null}
       </div>

       {/* Bottom Content Rows */}
       {showAdvancedSequence ? (
       <>
       {/* Domain Adaptation Overview */}
       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
             <div>
               <h2 className="text-base font-bold text-slate-900">8. Domain Adaptation Overview</h2>
               <p className="text-xs text-slate-500 font-medium mt-1">This sequence is universal. Domains may provide content adaptation inside each section, not sequence change.</p>
             </div>
             <button type="button" onClick={startJsonEdit} className="text-[11px] font-bold border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">Manage Domain Adaptations</button>
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
       </>
       ) : null}

    </div>
  );
}
