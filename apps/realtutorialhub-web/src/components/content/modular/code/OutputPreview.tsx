'use client';

import React from 'react';
import { Play, RotateCcw } from 'lucide-react';

import { getTutorialAssetAlt, getTutorialAssetImageSource } from '../shared/tutorialAsset';

interface OutputPreviewProps {
  data: {
    expectedOutput: string;
    description: string;
    previewAsset?: unknown;
  };
  }

export function OutputPreview({ data }: OutputPreviewProps) {
  if (!data) return null;
  const previewSource = getTutorialAssetImageSource(data.previewAsset);
  const previewAlt = getTutorialAssetAlt(data.previewAsset, 'Code output preview');

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-[#020617] overflow-hidden shadow-xl">
      {/* Console Header */}
      <div className="px-4 py-3 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play size={12} className="fill-emerald-500 text-emerald-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Output</span>
        </div>
        <RotateCcw size={12} className="text-slate-700 cursor-not-allowed" />
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-6 font-mono text-sm">
        <div className="text-slate-600 mb-2 select-none">$ running process...</div>
        {previewSource ? (
          <div className="mb-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSource} alt={previewAlt} className="w-full rounded-md object-contain" />
          </div>
        ) : null}
        <pre className="text-emerald-400 bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/10 whitespace-pre-wrap">
          {data.expectedOutput}
        </pre>
      </div>

      {/* Context Panel */}
      <div className="p-4 bg-slate-900/20 border-t border-slate-800/40">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Observation</h4>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {data.description}
        </p>
      </div>
    </div>
  );
}
