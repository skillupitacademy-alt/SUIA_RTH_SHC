"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import type { LegacyTabCommonProps, ComponentArchitecture } from './types';
import { formatTitle, getIconForComponent } from '../utils';

export function LearningProgressionTab({
  activeSectionKey,
  activeComponentMap,
  activeLearningFlow,
  isUiUxMode,
  selectedComponentKey,
  setSelectedComponentKey,
  selectedComponentData,
  selectedComponentIndex,
  adminSectionId,
  setActiveTab
}: LegacyTabCommonProps & {
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{isUiUxMode ? 'UI/UX Rendering Progression' : 'Learning Progression'} for {formatTitle(String(adminSectionId))}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {isUiUxMode ? 'This tab explains where the selected UI component sits in the learner-facing rendering flow and which renderer presents it.' : 'This tab explains where the selected component sits in the learner journey and what should happen before and after it.'}
              </p>
            </div>
            <button type="button" onClick={() => setActiveTab('Section Sequence')} className="px-4 py-2 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-black hover:bg-indigo-100">
              Edit Sequence
            </button>
          </div>
          <div className="space-y-3">
            {activeLearningFlow.map((key, index) => {
              const item = activeComponentMap[key] as ComponentArchitecture | undefined;
              const isSelected = selectedComponentKey === key;
              const Icon = getIconForComponent(index);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedComponentKey(key)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${isSelected ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon size={18} />
                    </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-slate-400">Step {index + 1}</span>
                          <h3 className="text-sm font-black text-slate-900">{formatTitle(key)}</h3>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-indigo-700">{key}</span>
                          {isSelected ? <span className="text-[10px] font-black text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-full">Selected</span> : null}
                        </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{isUiUxMode ? String(item?.renderer || item?.component || 'Defines this UI rendering step inside the section.') : item?.purpose || 'Defines this learning step inside the section.'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Selected Component Role</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Component</span>
                <p className="font-black text-slate-900">{selectedComponentKey ? formatTitle(selectedComponentKey) : 'None selected'}</p>
                <p className="font-mono text-xs font-black text-indigo-700">{selectedComponentKey || 'none'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Before</span>
                <p className="font-bold text-slate-700">{activeLearningFlow[selectedComponentIndex - 1] ? formatTitle(activeLearningFlow[selectedComponentIndex - 1]) : 'Start of section'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">After</span>
                <p className="font-bold text-slate-700">{activeLearningFlow[selectedComponentIndex + 1] ? formatTitle(activeLearningFlow[selectedComponentIndex + 1]) : 'End of section'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isUiUxMode ? 'Renderer / UI Role' : 'Purpose'}</span>
                <p className="font-medium text-slate-700 leading-relaxed">{isUiUxMode ? String(selectedComponentData?.renderer || selectedComponentData?.component || 'Select a component to see its UI purpose.') : selectedComponentData?.purpose || 'Select a component to see its educational purpose.'}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl border border-purple-100 p-6">
            <h3 className="text-base font-bold text-purple-950 mb-3">What to Do Here</h3>
            <p className="text-sm text-purple-800 leading-relaxed">
              {isUiUxMode ? 'Use this tab to confirm whether the selected UI component appears at the right point in the learner page rendering flow. If the look is wrong, go to Renderer Mapping.' : 'Use this tab to decide whether the selected component belongs at this point in the learning flow. If order is wrong, go to Section Sequence. If content shape is wrong, go to JSON Schema.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
