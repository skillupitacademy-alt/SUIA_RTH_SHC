'use client';

import React from 'react';

interface LaymanVisualProps {
  data: any;
  themeColor: string;
}

export function LaymanVisual({ data, themeColor }: LaymanVisualProps) {
  if (!data) return null;

  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">LaymanVisual</h3>
      <pre className="text-[10px] text-slate-500 overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
