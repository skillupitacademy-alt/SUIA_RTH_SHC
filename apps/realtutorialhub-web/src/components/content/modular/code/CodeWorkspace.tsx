'use client';

import React from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeWorkspaceProps {
  data: {
    codeTitle: string;
    language: string;
    codeSnippet: string;
    explanation?: string;
  };
  }

export function CodeWorkspace({ data }: CodeWorkspaceProps) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-[#0d1117] overflow-hidden shadow-2xl">
      {/* IDE Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.codeTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {data.language}
          </span>
          <button 
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 p-6 overflow-auto custom-scrollbar">
        <pre className="font-mono text-sm leading-relaxed text-slate-300">
          <code>{data.codeSnippet}</code>
        </pre>
      </div>

      {/* Footer Info */}
      {data.explanation && (
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800/50">
          <div className="flex gap-3">
            <div className="mt-1 w-1 h-1 rounded-full bg-sky-500 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed italic">
              {data.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
