"use client";

/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
import React from 'react';
import { CheckCircle2, Plus, Layout, ArrowRight, RotateCcw } from 'lucide-react';
import { formatTitle, getColorForComponent } from '../utils';
import type { LegacyTabCommonProps } from './types';

interface LegacyPromptManagementTabContentProps extends Pick<LegacyTabCommonProps, 
  'activeData' | 
  'isUiUxMode'
> {}

export function LegacyPromptManagementTabContent({ 
  activeData,
  isUiUxMode,
}: LegacyPromptManagementTabContentProps) {
  if (isUiUxMode) {
    return null;
  }

  return (
    <div className="space-y-6 pb-10">
       
       <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-5 items-start">
          
          {/* COLUMN 1 (span 2) */}
          <div className="xl:col-span-2 space-y-5 flex flex-col">
             
             {/* 1. Prompt Metadata */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-slate-900 mb-4">1. Prompt Metadata</h2>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="prompt-name" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Prompt Name <span className="text-rose-500">*</span></label>
                    <input id="prompt-name" type="text" className="w-full border border-slate-200 rounded p-2 text-xs font-bold text-slate-800" value="Layman Explanation - Beginner Friendly" readOnly/>
                  </div>
                  <div>
                    <label htmlFor="prompt-slug" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Prompt Slug</label>
                    <input id="prompt-slug" type="text" className="w-full border border-slate-200 rounded p-2 text-[10px] font-mono text-slate-500 bg-slate-50" value="layman-beginner-explanation-v2.3" readOnly/>
                  </div>
                  <div>
                    <label htmlFor="learning-objective" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Learning Objective</label>
                    <textarea id="learning-objective" className="w-full border border-slate-200 rounded p-2 text-xs text-slate-600 h-16 resize-none" readOnly defaultValue="Explain the concept in simplest terms using real-life analogies." />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label htmlFor="est-time" className="text-[9px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Est. Time</label>
                        <select id="est-time" className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-700 bg-slate-50"><option>5 - 7 min</option></select>
                     </div>
                     <div>
                        <label htmlFor="target-audience" className="text-[9px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Target Audience</label>
                        <select id="target-audience" className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-700 bg-slate-50"><option>Beginners</option></select>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label htmlFor="ai-model" className="text-[9px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">AI Model</label>
                        <select id="ai-model" className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-700 bg-slate-50"><option>GPT-4o</option></select>
                     </div>
                     <div>
                        <label htmlFor="prompt-status" className="text-[9px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Status</label>
                        <select id="prompt-status" className="w-full border border-slate-200 rounded p-1.5 text-xs font-bold text-amber-600 bg-amber-50"><option>Draft</option></select>
                     </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-[9px]">
                     <div>
                       <span className="block font-bold text-slate-400">Created By</span>
                       <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5"><div className="w-3 h-3 bg-purple-500 rounded-full"></div> Super Admin</span>
                     </div>
                     <div className="text-right">
                       <span className="block font-bold text-slate-400">Last Updated</span>
                       <span className="font-bold text-slate-700 mt-0.5 block">15 May 2026, 10:30 AM</span>
                     </div>
                  </div>
                  <div className="pt-1">
                     <label htmlFor="prompt-tags" className="text-[9px] font-bold text-slate-400 mb-1.5 block">Tags</label>
                     <div id="prompt-tags" className="flex flex-wrap gap-1.5">
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Beginner</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Layman</span>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Analogy</span>
                     </div>
                  </div>
                </div>
             </div>

             {/* 7. Renderer Mapping Configuration */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-slate-900 mb-3">7. Renderer Mapping</h2>
                <div className="overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap">
                     <thead className="border-b border-slate-100">
                       <tr>
                         <th className="py-1.5 text-[9px] font-bold text-slate-500 uppercase">Component</th>
                         <th className="py-1.5 text-[9px] font-bold text-slate-500 uppercase">Renderer</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {(Object.entries(activeData.universal_architecture_fixed || {}) as [string, any][]).slice(0,5).map(([key, item], index) => {
                         const color = getColorForComponent(index);
                         return (
                           <tr key={key}>
                             <td className="py-2 text-[10px] font-bold text-slate-800 truncate max-w-[80px]">{formatTitle(key)}</td>
                             <td className="py-2 text-[10px] font-bold"><span className={`${color.text}`}>{item.renderer || 'default'}</span></td>
                           </tr>
                         )
                       })}
                     </tbody>
                   </table>
                </div>
             </div>

             {/* 11. RBAC & Security */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-slate-900 mb-3">11. RBAC & Security</h2>
                <div className="space-y-2">
                   <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                     <span className="text-[10px] font-bold text-slate-700">Educational Architect</span>
                     <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Active</span>
                   </div>
                   <div className="flex justify-between items-center px-2">
                     <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500"/> Create / Edit Prompt</span>
                   </div>
                   <div className="flex justify-between items-center px-2">
                     <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500"/> Generate AI Draft</span>
                   </div>
                   <div className="flex justify-between items-center px-2">
                     <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 line-through opacity-50"><div className="w-2.5 h-2.5 rounded-full border border-slate-300"></div> Publish Prompt</span>
                   </div>
                </div>
             </div>

          </div>

          {/* COLUMN 2 (span 3) */}
          <div className="xl:col-span-3 space-y-5 flex flex-col">
             
             {/* 2. Prompt Instruction Builder */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-4">2. Prompt Instruction Builder</h2>
                
                <div className="space-y-4">
                    <div>
                     <label htmlFor="edu-goal" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Educational Goal</label>
                     <p id="edu-goal" className="text-xs text-slate-700 bg-blue-50 border border-blue-100 p-2 rounded leading-relaxed font-medium">Break down complex topics into simple terms. Use everyday examples.</p>
                   </div>
                   
                    <div>
                     <label htmlFor="audience-psychology" className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">Audience Psychology</label>
                     <div id="audience-psychology" className="flex items-center gap-4 mb-2">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                         <div className="w-6 h-3.5 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"></div></div>
                         Fear Reduction
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                         <div className="w-6 h-3.5 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"></div></div>
                         Confidence Boosting
                       </div>
                     </div>
                   </div>

                    <div>
                     <label htmlFor="teaching-style" className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">Teaching Style</label>
                     <div id="teaching-style" className="flex flex-wrap gap-2">
                       <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Analogy First</span>
                       <span className="text-[10px] font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded">Storytelling</span>
                       <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-1 rounded flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Step-by-Step</span>
                       <span className="text-[10px] font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded">Visual Thinking</span>
                     </div>
                   </div>

                    <div>
                     <label htmlFor="complexity-controls" className="text-[10px] font-bold text-slate-500 mb-3 block uppercase tracking-wider">Complexity Controls</label>
                     <div id="complexity-controls" className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="w-24 text-[10px] font-medium text-slate-600">Beginner Focus</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[90%]"></div></div>
                          <span className="text-[10px] font-bold text-slate-800 w-8 text-right">90%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-24 text-[10px] font-medium text-slate-600">Technical Depth</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-400 w-[20%]"></div></div>
                          <span className="text-[10px] font-bold text-slate-800 w-8 text-right">20%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-24 text-[10px] font-medium text-slate-600">Real-world Examples</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[80%]"></div></div>
                          <span className="text-[10px] font-bold text-slate-800 w-8 text-right">80%</span>
                        </div>
                     </div>
                   </div>
                </div>
             </div>

             {/* 8. Learning Progression Flow Builder */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-bold text-slate-900">8. Flow Builder</h2>
                  <button className="text-[9px] font-bold text-blue-600 border border-blue-100 px-2 py-1 rounded hover:bg-blue-50">+ Add Node</button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center py-2">
                   {Object.keys(activeData.universal_architecture_fixed || {}).slice(0,4).map((key: string, index: number) => {
                     const color = getColorForComponent(index);
                     return (
                       <div key={key} className="flex items-center gap-1">
                         <div className={`px-2 py-1.5 rounded border ${color.bg} ${color.text} border-current text-[9px] font-bold bg-opacity-10`}>
                           {index + 1}. {formatTitle(key).split(' ')[0]}
                         </div>
                         {index < 3 && <ArrowRight size={10} className="text-slate-300"/>}
                       </div>
                     )
                   })}
                </div>
             </div>

             {/* 12. Analytics & Performance */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-slate-900 mb-3">12. Analytics</h2>
                <div className="grid grid-cols-2 gap-2 mb-3">
                   <div className="border border-slate-100 rounded p-2 text-center">
                     <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Generations</span>
                     <span className="text-sm font-black text-slate-800">1,248</span>
                   </div>
                   <div className="border border-slate-100 rounded p-2 text-center">
                     <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Quality Score</span>
                     <span className="text-sm font-black text-emerald-600">92.6</span>
                   </div>
                </div>
                <div className="h-20 w-full bg-slate-50 rounded border border-slate-100 relative overflow-hidden">
                   <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                     <path d="M0,30 L20,25 L40,35 L60,15 L80,20 L100,5" fill="none" stroke="#6366f1" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                     <path d="M0,35 L20,30 L40,38 L60,25 L80,28 L100,15" fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                   </svg>
                </div>
             </div>

          </div>

          {/* COLUMN 3 (span 4) */}
          <div className="xl:col-span-4 space-y-5 flex flex-col">
             
             {/* 3. Prompt Template Editor */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px]">
                <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                   <h2 className="text-sm font-bold text-slate-900">3. Prompt Template Editor</h2>
                   <div className="flex gap-1.5">
                     <button className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm hover:bg-slate-50 flex items-center gap-1"><Plus size={10}/> Insert Variable</button>
                     <button className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm hover:bg-slate-50 flex items-center gap-1"><Layout size={10}/> Format</button>
                   </div>
                </div>
                <div className="flex-1 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-700 overflow-y-auto custom-scrollbar relative">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-50 border-r border-slate-100 flex flex-col items-center pt-4 text-[9px] text-slate-400 select-none">
                     {Array.from({length: 25}).map((_, i) => <div key={i} className="h-[1.65rem]">{i+1}</div>)}
                  </div>
                  <div className="pl-6 whitespace-pre-wrap">
{`You are an expert educational content creator.
Your task is to explain the following concept in the simplest and most relatable way for a complete beginner.

Concept Details:
Domain:    {{domain}}
Subject:   {{subject}}
Topic:     {{topic}}
Subtopic:  {{subtopic}}
Difficulty: {{difficulty}}
Target Audience: {{{target_audience}}}

Requirements:
1. Start with a simple overview using easy language.
2. Use a real-life analogy that anyone can relate to.
3. Explain why it exists and how it helps.
4. Provide simple use cases from daily life.
5. Break it down step-by-step for beginners.
6. Build a mental model or visual understanding.
7. Clarify common confusions.
8. End with a simple recap of key takeaways.

Writing Guidelines:
- Use short sentences.
- Avoid technical jargon unless explicitly defined immediately.`}
                  </div>
                </div>
                <div className="p-2 border-t border-slate-200 bg-slate-50 flex justify-between text-[9px] font-bold text-slate-500 shrink-0">
                   <span>Tokens: 1,256 &nbsp;|&nbsp; Words: 245</span>
                   <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10}/> Auto-saved 10:30 AM</span>
                </div>
             </div>

             {/* 9. Validation & Governance */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-6">
                <div className="shrink-0 relative w-24 h-24 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none"/>
                     <circle cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset="18"/>
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-xl font-black text-slate-900">92.6</span>
                     <span className="text-[8px] font-bold text-slate-500 uppercase">/100</span>
                   </div>
                </div>
                <div className="flex-1 space-y-2">
                   <h2 className="text-sm font-bold text-slate-900 mb-2 font-mono">9. Validation & Governance</h2>
                   <div className="flex justify-between items-center text-[10px] font-medium"><span className="text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Structure Validation</span><span className="font-bold text-slate-800">98/100</span></div>
                   <div className="flex justify-between items-center text-[10px] font-medium"><span className="text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Readability Score</span><span className="font-bold text-slate-800">95/100</span></div>
                   <div className="flex justify-between items-center text-[10px] font-medium"><span className="text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Analogy Quality</span><span className="font-bold text-slate-800">93/100</span></div>
                   <div className="flex justify-between items-center text-[10px] font-medium"><span className="text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Hallucination Risk</span><span className="font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Low</span></div>
                </div>
             </div>

          </div>

          {/* COLUMN 4 (span 3) */}
          <div className="xl:col-span-3 space-y-5 flex flex-col">
             
             {/* 4. Variable Inspector */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-slate-900 mb-3 font-mono">4. Variable Inspector</h2>
                <div className="space-y-2">
                   <div className="flex justify-between items-center text-[10px]">
                     <span className="font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">{`{{domain}}`}</span>
                     <span className="text-slate-600 font-medium">Programming</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px]">
                     <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{`{{subject}}`}</span>
                     <span className="text-slate-600 font-medium">JavaScript</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px]">
                     <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{`{{topic}}`}</span>
                     <span className="text-slate-600 font-medium">JS Fundamentals</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px]">
                     <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{`{{difficulty}}`}</span>
                     <span className="text-slate-600 font-medium">Beginner Friendly</span>
                   </div>
                </div>
             </div>

             {/* 5. AI Generation Controls */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-slate-900 mb-4">5. AI Generation Controls</h2>
                <div className="space-y-4">
                   <div>
                     <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><span>Temperature</span><span className="text-slate-800">0.7</span></div>
                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[70%]"></div></div>
                   </div>
                    <div>
                     <label htmlFor="creativity-level" className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Creativity Level</label>
                     <select id="creativity-level" className="w-full border border-slate-200 rounded p-1.5 text-[10px] font-bold text-slate-700 bg-slate-50"><option>Balanced</option></select>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-600"><span>Educational Strictness</span><div className="w-10 h-1.5 bg-slate-200 rounded-full"><div className="w-2/3 h-full bg-indigo-500 rounded-full"></div></div></div>
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-600"><span>Hallucination Prevention</span><div className="w-10 h-1.5 bg-slate-200 rounded-full"><div className="w-full h-full bg-indigo-500 rounded-full"></div></div></div>
                   </div>
                   <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Safety Mode</span>
                     <div className="w-6 h-3.5 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"></div></div>
                   </div>
                </div>
             </div>

             {/* 6. Live AI Draft Preview */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[300px]">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                   <h2 className="text-sm font-bold text-slate-900">6. AI Draft Preview</h2>
                </div>
                <div className="flex text-[9px] font-bold border-b border-slate-100 shrink-0">
                   <div className="flex-1 text-center py-2 text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50">Generated Output</div>
                   <div className="flex-1 text-center py-2 text-slate-500 hover:bg-slate-50 cursor-pointer">Side-by-Side Diff</div>
                </div>
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar text-[10px] text-slate-700 leading-relaxed space-y-3">
                   <div>
                     <strong className="text-slate-900 block mb-1">Simple Overview</strong>
                     A variable in JavaScript is like a container that holds data. You can store numbers, text, or even other values inside it and use or change them whenever you need.
                   </div>
                   <div>
                     <strong className="text-slate-900 block mb-1">Everyday Analogy</strong>
                      Think of a variable like a labeled box. You write something on the label (the variable name), put something inside the box (the value), and later you can open the box, see what&apos;s inside, or even replace it with something new.
                   </div>
                   <div className="text-slate-400 italic">... (more content)</div>
                </div>
                <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                   <button className="w-full flex justify-center items-center gap-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 py-1.5 rounded hover:bg-indigo-50"><RotateCcw size={10}/> Regenerate Draft</button>
                </div>
             </div>

          </div>

       </div>
    </div>
  );
}
