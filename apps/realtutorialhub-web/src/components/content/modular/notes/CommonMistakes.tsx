'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CommonMistakesProps {
  data: {
    title: string;
    mistakes: Array<{
      id: string;
      mistake: string;
      fix: string;
    }>;
  };
  themeColor: string;
}

export function CommonMistakes({ data, themeColor }: CommonMistakesProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-rose-900/30 bg-rose-900/5 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-5">
        <AlertCircle size={18} className="text-rose-500" />
        <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">{data.title}</h3>
      </div>

      <div className="space-y-4">
        {data.mistakes.map((item) => (
          <div key={item.id} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
            <p className="text-xs font-bold text-rose-400 mb-2">❌ {item.mistake}</p>
            <p className="text-[11px] text-slate-400 leading-normal pl-5 border-l border-rose-500/20">
              <span className="font-bold text-emerald-500/80 mr-1">Fix:</span> {item.fix}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
