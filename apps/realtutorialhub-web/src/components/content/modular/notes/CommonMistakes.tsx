'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { getSurfaceStyle, getUiuxColor, type NotesUiuxContract } from './uiuxContract';

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
  uiux?: NotesUiuxContract;
}

export function CommonMistakes({ data, themeColor = '#e11d48', uiux }: CommonMistakesProps) {
  if (!data) return null;
  const primaryColor = getUiuxColor(uiux, 'primary_color', themeColor);

  return (
    <div className="rounded-3xl border border-rose-100 bg-white shadow-lg" style={getSurfaceStyle(uiux, themeColor)}>
      <div className="mb-5 flex items-center gap-3">
        <AlertCircle size={20} style={{ color: primaryColor }} />
        <h3 className="text-2xl font-black text-slate-950">{data.title}</h3>
      </div>

      <div className="space-y-4">
        {data.mistakes.map((item) => (
          <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
            <p className="mb-2 text-sm font-black" style={{ color: primaryColor }}>{item.mistake}</p>
            <p className="border-l-4 border-emerald-400 pl-4 text-sm font-semibold leading-6 text-slate-600">
              <span className="mr-1 font-black text-emerald-600">Fix:</span> {item.fix}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
