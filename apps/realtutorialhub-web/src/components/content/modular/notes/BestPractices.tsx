'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getSurfaceStyle, getUiuxColor, type NotesUiuxContract } from './uiuxContract';

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
  uiux?: NotesUiuxContract;
}

export function BestPractices({ data, themeColor = '#10b981', uiux }: BestPracticesProps) {
  if (!data) return null;
  const primaryColor = getUiuxColor(uiux, 'primary_color', themeColor);

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white shadow-lg" style={getSurfaceStyle(uiux, themeColor)}>
      <div className="mb-5 flex items-center gap-3">
        <CheckCircle2 size={20} style={{ color: primaryColor }} />
        <h3 className="text-2xl font-black text-slate-950">{data.title}</h3>
      </div>

      <div className="space-y-4">
        {data.practices.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: primaryColor }} />
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
