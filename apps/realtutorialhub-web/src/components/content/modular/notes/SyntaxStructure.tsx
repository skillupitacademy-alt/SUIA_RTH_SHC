'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';

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
}

export function SyntaxStructure({ data, themeColor }: SyntaxStructureProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1117] overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Code2 size={18} style={{ color: themeColor }} />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">{data.title}</h3>
        </div>
        <button 
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
          title="Copy snippet"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      <div className="p-6">
        <pre className="text-sm font-mono text-slate-300 overflow-x-auto p-4 rounded-xl bg-black/30 border border-slate-800/50 mb-6">
          <code>{data.codeSnippet}</code>
        </pre>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.breakdown.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-700 transition-all">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1 block">Part {idx + 1}</span>
              <div className="text-xs font-mono font-bold mb-1" style={{ color: themeColor }}>{item.part}</div>
              <p className="text-[12px] text-slate-400 leading-normal">{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
