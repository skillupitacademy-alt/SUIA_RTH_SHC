'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface BestPracticesProps {
  data: {
    title: string;
    practices: Array<{
      id: string;
      label: string;
      tip: string;
    }>;
  };
  }

export function BestPractices({ data }: BestPracticesProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-emerald-900/30 bg-emerald-900/5 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-5">
        <CheckCircle2 size={18} className="text-emerald-500" />
        <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest">{data.title}</h3>
      </div>

      <div className="space-y-4">
        {data.practices.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-200 mb-1">{item.label}</p>
              <p className="text-[11px] text-slate-400 leading-normal italic">
                {`"${item.tip}"`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
