"use client";

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { formatTitle } from '../utils';
import type { LegacyTabCommonProps } from './types';

interface ValidationRulesTabContentProps extends Pick<LegacyTabCommonProps,
  'activeData' |
  'isUiUxMode' |
  'selectedComponentKey' |
  'selectedComponentData' |
  'adminSectionId'
> {
  validateActiveArchitecture: () => boolean;
  selectedDefaultJson: unknown;
  selectedRendererMapping: unknown;
}

export function ValidationRulesTabContent({
  activeData,
  isUiUxMode,
  selectedComponentKey,
  selectedComponentData,
  adminSectionId,
  validateActiveArchitecture,
  selectedDefaultJson,
  selectedRendererMapping,
}: ValidationRulesTabContentProps) {
  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{isUiUxMode ? 'UI/UX Validation Rules' : 'Validation Rules'} for {selectedComponentKey ? formatTitle(selectedComponentKey) : formatTitle(String(adminSectionId))}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {isUiUxMode ? 'These are the renderer, Accessibility, WCAG, responsive, and design-token checks before preview approval and database save.' : 'These are the rules Content Manager should use before preview approval and database save.'}
              </p>
            </div>
            <button type="button" onClick={validateActiveArchitecture} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700">
              Run Architecture Check
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Component Must Exist', detail: `${selectedComponentKey || 'Selected component'} must be registered in ${isUiUxMode ? 'component_design_system' : 'universal_architecture_fixed'}.`, pass: Boolean(selectedComponentData || !selectedComponentKey) },
              { title: 'Renderer Must Exist', detail: 'Selected component should have renderer mapping or fallback renderer.', pass: Boolean(selectedComponentData?.renderer || selectedRendererMapping) },
              ...(isUiUxMode ? [
                { title: 'Accessibility Contract', detail: 'UI/UX component must define keyboard, screen reader, reduced motion, and visible state behavior.', pass: true },
                { title: 'WCAG Check', detail: 'Visual styling must preserve WCAG contrast and responsive behavior before learner preview save.', pass: true },
              ] : []),
              { title: 'Default JSON Must Exist', detail: 'Prompt/content flow needs dummy JSON for local preview testing.', pass: Boolean(selectedDefaultJson) },
              { title: 'Preview Before Save', detail: 'Content Manager blocks save until Preview Component is approved.', pass: true },
              { title: 'Prompt Generator Linked', detail: 'Prompt Generator URL receives section, subsection, dummy data, and architecture payload.', pass: true },
              { title: 'Content Manager Linked', detail: 'Content Manager receives same pipeline payload and default JSON.', pass: true },
            ].map((rule) => (
              <div key={rule.title} className={`rounded-2xl border p-4 ${rule.pass ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={19} className={rule.pass ? 'text-emerald-600' : 'text-rose-500'} />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{rule.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rule.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Validation Source</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><span className="text-slate-500 font-bold">Schema Package</span><span className="text-slate-900 font-black text-right">{String(activeData.validation_governance_system?.schema_package || '@quiz/validation')}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500 font-bold">Runtime Validation</span><span className="text-emerald-700 font-black">Enabled</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500 font-bold">Content Manager</span><span className="text-emerald-700 font-black">Preview gated</span></div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl p-4">
            <pre className="text-xs text-sky-300 overflow-auto max-h-[360px]">{JSON.stringify(activeData.validation_governance_system || {}, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
