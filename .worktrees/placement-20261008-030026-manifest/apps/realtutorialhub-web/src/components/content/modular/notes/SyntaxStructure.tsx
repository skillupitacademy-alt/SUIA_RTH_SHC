'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import { getSurfaceStyle, getUiuxColor, isPartVisible, type NotesUiuxContract } from './uiuxContract';

interface SyntaxStructureProps {
  data: {
    title: string;
    codeSnippet: string;
    language: string;
    breakdown: Array<{
      part: string;
      explanation: string;
    }>;
  };
  themeColor: string;
  uiux?: NotesUiuxContract;
}

export function SyntaxStructure({ data, themeColor, uiux }: SyntaxStructureProps) {
  const [copied, setCopied] = useState(false);
  const primaryColor = getUiuxColor(uiux, 'primary_color', themeColor);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl" style={getSurfaceStyle(uiux, themeColor)}>
      {isPartVisible(uiux, 'header') ? <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <Code2 size={18} style={{ color: primaryColor }} />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">{data.title}</h3>
        </div>
        <button 
          onClick={handleCopy}
          className="rounded-lg bg-white p-2 text-slate-500 transition-colors hover:text-slate-900"
          title="Copy snippet"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div> : null}

      {isPartVisible(uiux, 'body') ? <div className="mt-5">
        <pre className="text-sm font-mono text-slate-300 overflow-x-auto p-4 rounded-xl bg-black/30 border border-slate-800/50 mb-6">
          <code>{data.codeSnippet}</code>
        </pre>

        {isPartVisible(uiux, 'action') ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.breakdown.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-tighter text-slate-400">Part {idx + 1}</span>
              <div className="mb-1 font-mono text-xs font-bold" style={{ color: primaryColor }}>{item.part}</div>
              <p className="text-[12px] font-semibold leading-normal text-slate-600">{item.explanation}</p>
            </div>
          ))}
        </div> : null}
      </div> : null}
    </div>
  );
}
