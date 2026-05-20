'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface PreviewProps {
  subsection: string;
  content: any;
}

export function SummaryPreview({ subsection, content }: PreviewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl flex items-center justify-between font-sans">
        <span className="text-[10px] font-black uppercase bg-teal-600/10 text-teal-400 px-2 py-0.5 rounded">
          Section: SUMMARY
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          {subsection ? `Subsection: ${subsection}` : 'Whole Block Render'}
        </span>
      </div>
      <pre className="overflow-auto bg-slate-955 rounded-xl p-4 text-[11px] text-slate-300 max-h-[450px] border border-slate-850 font-mono">
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
}
