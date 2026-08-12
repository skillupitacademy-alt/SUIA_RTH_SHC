"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Copy, Edit2 } from 'lucide-react';
import { formatTitle } from '../utils';
import type { LegacyTabCommonProps } from './types';
import type { ComponentArchitecture } from './types';

interface JSONSchemaTabContentProps extends Pick<LegacyTabCommonProps,
  'activeData' |
  'isUiUxMode' |
  'selectedComponentKey' |
  'adminSectionId' |
  'copyArchitectureJson' |
  'openWorkflowUrl' |
  'selectedWorkflowUrls' |
  'activeComponentMap'
> {
  selectedSchemaPreview: {
    section: string;
    subsection: string;
    componentPurpose: string;
    renderer: string;
    required: boolean;
    defaultDummyJson: unknown;
  };
  activeComponentEntries: Array<[string, ComponentArchitecture]>;
}

export function JSONSchemaTabContent({
  activeData,
  isUiUxMode,
  selectedComponentKey,
  adminSectionId,
  copyArchitectureJson,
  openWorkflowUrl,
  selectedWorkflowUrls,
  selectedSchemaPreview,
  activeComponentEntries,
}: JSONSchemaTabContentProps) {
  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isUiUxMode ? 'UI/UX JSON Schema / Renderer Contract' : 'JSON Schema / Default Dummy Content'}</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              This shows the exact {isUiUxMode ? 'component_design_system and renderer contract' : 'JSON shape'} that will be sent to Content Manager for the currently selected component.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={copyArchitectureJson} className="px-4 py-2 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-black hover:bg-indigo-100 flex items-center gap-2">
              <Copy size={14} /> Copy Architecture JSON
            </button>
            <button type="button" onClick={() => openWorkflowUrl(selectedWorkflowUrls.contentManager)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black hover:bg-blue-700 flex items-center gap-2">
              <Edit2 size={14} /> Open Content Manager
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Selected Component Schema Summary</h3>
          <div className="space-y-4 text-sm">
            <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Section</span><p className="font-black text-slate-900">{String(adminSectionId)}</p></div>
            <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subsection</span><p className="font-black text-slate-900">{selectedComponentKey || 'Full section'}</p></div>
            <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Source Object</span><p className="font-mono text-xs font-black text-indigo-700">{isUiUxMode ? 'component_design_system' : 'universal_architecture_fixed'}</p></div>
            <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Renderer</span><p className="font-black text-slate-900">{String(selectedSchemaPreview.renderer)}</p></div>
            <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Required</span><p className="font-black text-slate-900">{selectedSchemaPreview.required ? 'Yes' : 'No'}</p></div>
            <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Purpose</span><p className="font-medium text-slate-700 leading-relaxed">{String(selectedSchemaPreview.componentPurpose)}</p></div>
          </div>
        </div>

        <div className="bg-slate-950 rounded-2xl p-5 shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white">Default JSON Sent to Content Manager</h3>
            <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">Dummy Data</span>
          </div>
          <pre className="text-xs text-emerald-300 overflow-auto max-h-[620px]">{JSON.stringify(selectedSchemaPreview, null, 2)}</pre>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Full Section Schema Contract</h3>
        <p className="mb-4 text-sm font-semibold text-slate-600">
          These are all canonical component keys registered for this Notes section under {isUiUxMode ? 'component_design_system' : 'universal_architecture_fixed'}. Content Manager should reject old aliases and save only this shape.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {activeComponentEntries.map(([key, item]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-mono text-xs font-black text-indigo-700">{key}</p>
              <p className="mt-1 text-sm font-black text-slate-900">{String((item as ComponentArchitecture).renderer || (item as ComponentArchitecture).component || 'default_renderer')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
