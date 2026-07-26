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
  themeColor?: string;
}

export function CommonMistakes({ data, themeColor = '#e11d48' }: CommonMistakesProps) {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-lg">
      <div className="mb-5 flex items-center gap-3">
        <AlertCircle size={20} style={{ color: themeColor }} />
        <h3 className="text-2xl font-black text-slate-950">{data.title}</h3>
      </div>

      <div className="space-y-4">
        {data.mistakes.map((item) => (
          <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
            <p className="mb-2 text-sm font-black" style={{ color: themeColor }}>{item.mistake}</p>
            <p className="border-l-4 border-emerald-400 pl-4 text-sm font-semibold leading-6 text-slate-600">
              <span className="mr-1 font-black text-emerald-600">Fix:</span> {item.fix}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
