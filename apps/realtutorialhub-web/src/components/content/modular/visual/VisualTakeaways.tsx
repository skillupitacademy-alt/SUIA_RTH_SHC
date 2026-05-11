'use client';

import React from 'react';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

interface VisualTakeawaysProps {
  data: {
    takeawayTitle: string;
    points: string[];
  };
  }

export function VisualTakeaways({ data }: VisualTakeawaysProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
          <Lightbulb size={18} />
        </div>
        <h3 className="text-lg font-bold text-slate-100">{data.takeawayTitle}</h3>
      </div>

      <ul className="space-y-4">
        {data.points.map((point, idx) => (
          <li key={idx} className="flex gap-3 group">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-slate-700 group-hover:text-emerald-500 transition-colors" />
            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
