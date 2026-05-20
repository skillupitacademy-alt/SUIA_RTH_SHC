'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { BookOpen, AlertTriangle } from 'lucide-react';

interface NotesPreviewProps {
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

export function NotesPreview({ subsection, content }: NotesPreviewProps) {
  if (!subsection) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl mb-4">
          <h4 className="text-xs font-black uppercase text-pink-500 tracking-wider">Notes Section Container View</h4>
        </div>
        {getSafe(content, 'simpleWords') && (
          <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
            <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded">Simple Words</span>
            <p className="text-sm font-semibold text-slate-200 mt-2 italic leading-relaxed">
              &ldquo;{getSafe(content, 'simpleWords')}&rdquo;
            </p>
          </div>
        )}
        {getSafe(content, 'definitionBlock') && (
          <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl border-l-4 border-l-pink-500">
            <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded">Definition Block</span>
            <h4 className="text-xl font-black text-white mt-2">{getSafe(content, 'definitionBlock.term')}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{getSafe(content, 'definitionBlock.definition')}</p>
            {getSafe(content, 'definitionBlock.memoryHook') && (
              <div className="mt-3 bg-pink-950/20 border border-pink-900/50 rounded-xl p-3 text-[11px] text-pink-300 italic">
                💡 {getSafe(content, 'definitionBlock.memoryHook')}
              </div>
            )}
          </div>
        )}
        {getSafe(content, 'componentGrid.components') && Array.isArray(getSafe(content, 'componentGrid.components')) && (
          <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
            <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded mb-3 block w-fit">Component Breakdown Grid</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {content.componentGrid.components.slice(0, 4).map((comp: any, idx: number) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                    {comp.name || comp.title}
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{comp.description || comp.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  switch (subsection) {
    case 'simpleWords':
      return (
        <div className="bg-slate-800/85 border border-slate-700/80 p-6 rounded-3xl relative overflow-hidden shadow-xl">
          <div className="absolute -right-6 -bottom-6 text-pink-500/10"><BookOpen size={100} /></div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase bg-pink-500/15 text-pink-400 px-2.5 py-1 rounded-md tracking-wider">
              Notes &bull; Simple Words
            </span>
          </div>
          <p className="text-base font-extrabold text-slate-100 leading-relaxed italic relative z-10">
            &ldquo;{typeof content === 'string' ? content : getSafe(content, 'simpleWords')}&rdquo;
          </p>
        </div>
      );

    case 'definitionBlock':
      return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] font-black uppercase bg-pink-500/15 text-pink-400 px-2.5 py-1 rounded-md tracking-wider">
            Notes &bull; Glossary Definition Card
          </span>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-white tracking-tight">
                {getSafe(content, 'term') || getSafe(content, 'definitionBlock.term') || 'Conceptual Term'}
              </h3>
              <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded leading-none">CORE</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              {getSafe(content, 'definition') || getSafe(content, 'definitionBlock.definition') || 'Dictionary description...'}
            </p>
            
            {(getSafe(content, 'memoryHook') || getSafe(content, 'definitionBlock.memoryHook')) && (
              <div className="mt-4 bg-pink-950/20 border border-pink-900/30 rounded-2xl p-4 flex gap-2">
                <span className="text-lg shrink-0">💡</span>
                <div>
                  <h5 className="text-[10px] font-black text-pink-400 uppercase tracking-wider">Memory Hook Analogy</h5>
                  <p className="text-[11px] text-pink-200 font-semibold italic mt-0.5 leading-relaxed">
                    {getSafe(content, 'memoryHook') || getSafe(content, 'definitionBlock.memoryHook')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case 'warningFaq':
      return (
        <div className="bg-amber-950/20 border-2 border-amber-900/60 rounded-3xl p-6 shadow-xl relative">
          <span className="text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1 w-fit">
            <AlertTriangle size={12} /> Gotchas & Warning FAQ
          </span>
          <div className="mt-4 space-y-3">
            <h4 className="text-base font-bold text-amber-200 flex items-center gap-2">
              ⚠️ {getSafe(content, 'warningTitle') || 'Common Pitfall Trap'}
            </h4>
            <p className="text-xs text-amber-100/90 leading-relaxed font-semibold">
              {getSafe(content, 'warningDescription') || 'Description of the trap and warning criteria...'}
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
          <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">
            {subsection} Subsection Detail
          </span>
          <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      );
  }
}
