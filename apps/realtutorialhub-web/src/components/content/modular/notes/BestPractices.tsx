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
  themeColor?: string;
}

export function BestPractices({ data, themeColor = '#10b981' }: BestPracticesProps) {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg">
      <div className="mb-5 flex items-center gap-3">
        <CheckCircle2 size={20} style={{ color: themeColor }} />
        <h3 className="text-2xl font-black text-slate-950">{data.title}</h3>
      </div>

      <div className="space-y-4">
        {data.practices.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: themeColor }} />
            <div>
              <p className="mb-1 text-sm font-black text-slate-900">{item.label}</p>
              <p className="text-sm font-semibold leading-6 text-slate-600">{item.tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
