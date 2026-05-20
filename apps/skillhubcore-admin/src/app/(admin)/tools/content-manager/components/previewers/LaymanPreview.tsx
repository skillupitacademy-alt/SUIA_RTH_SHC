'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Cpu } from 'lucide-react';

interface LaymanPreviewProps {
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

export function LaymanPreview({ subsection, content }: LaymanPreviewProps) {
  if (!subsection) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
          <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider">Layman Section Container View</h4>
        </div>
        {getSafe(content, 'everydayAnalogy.analogyName') && (
          <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl border-l-4 border-l-amber-500">
            <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Everyday Analogy</span>
            <h4 className="text-lg font-black text-white mt-2">{getSafe(content, 'everydayAnalogy.analogyName')}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{getSafe(content, 'everydayAnalogy.explanation')}</p>
          </div>
        )}
      </div>
    );
  }

  switch (subsection) {
    case 'everydayAnalogy':
      return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-amber-500/10"><Cpu size={100} /></div>
          <span className="text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1 w-fit">
            <Cpu size={12} /> Layman &bull; Everyday Analogy
          </span>
          <div className="mt-4 space-y-3 relative z-10">
            <h3 className="text-xl font-black text-white tracking-tight">
              {getSafe(content, 'analogyName') || getSafe(content, 'everydayAnalogy.analogyName') || 'Metaphor Comparison'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              {getSafe(content, 'explanation') || getSafe(content, 'everydayAnalogy.explanation') || 'Plain English analogy breakdown...'}
            </p>
            
            {(getSafe(content, 'visualConcept') || getSafe(content, 'everydayAnalogy.visualConcept')) && (
              <div className="mt-3 bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-[11px] text-amber-300 font-medium">
                🎨 Metaphor Graphic Mapping: {getSafe(content, 'visualConcept') || getSafe(content, 'everydayAnalogy.visualConcept')}
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
            {subsection} Subsection Detail
          </span>
          <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      );
  }
}
