'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Terminal } from 'lucide-react';

interface CodePreviewProps {
  subsection: string;
  content: any;
}

const getSafe = (obj: any, path: string, fallback = '') => {
  if (!obj || typeof obj !== 'object') return fallback;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object') return fallback;
    cur = cur[p];
  }
  return cur !== undefined && cur !== null ? cur : fallback;
};

export function CodePreview({ subsection, content }: CodePreviewProps) {
  if (subsection === 'basicCodeExample') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-bold">Code Sandbox Preview</span>
        </div>
        <div className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">
            🖥️ {getSafe(content, 'title') || getSafe(content, 'basicCodeExample.title') || 'Interactive Editor File'}
          </h4>
          <div className="bg-slate-955 rounded-xl p-4 border border-slate-850 font-mono text-xs text-emerald-400">
            <pre className="overflow-x-auto whitespace-pre">
              {getSafe(content, 'code') || getSafe(content, 'basicCodeExample.code') || '# Paste programming syntax here'}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (subsection === 'outputDemonstration') {
    return (
      <div className="bg-slate-955 border border-slate-850 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-900 pb-2">
          <Terminal size={16} className="text-slate-500" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Console Simulator Output</span>
        </div>
        <div className="font-mono text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
            &gt; {getSafe(content, 'simulatedLogs') || getSafe(content, 'outputDemonstration.simulatedLogs') || 'Execution logs...'}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
        Code &bull; {subsection || 'Whole Section'} Detail
      </span>
      <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
}
