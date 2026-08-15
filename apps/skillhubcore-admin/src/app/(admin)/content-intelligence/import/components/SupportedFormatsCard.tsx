'use client';

import React from 'react';

export function SupportedFormatsCard() {
  const activeFormats = ['.txt', '.md', '.html'];
  const deferredFormats = ['.docx', '.pdf'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
        Supported Formats
      </h3>

      <div className="flex flex-wrap gap-2 mb-2">
        {activeFormats.map((fmt) => (
          <span
            key={fmt}
            className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200"
            title="Directly parsed into TutorialDocument"
          >
            {fmt}
          </span>
        ))}
        {deferredFormats.map((fmt) => (
          <span
            key={fmt}
            className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-400 font-mono text-xs font-normal border border-slate-200"
            title="Binary document - server parsing deferred"
          >
            {fmt} <span className="text-[10px] text-slate-400 font-sans">(planned)</span>
          </span>
        ))}
      </div>

      <div className="text-[11px] text-slate-400 mt-2">
        Max file size: 20MB &bull; .md, .txt, and .html are parsed directly
      </div>
    </div>
  );
}
