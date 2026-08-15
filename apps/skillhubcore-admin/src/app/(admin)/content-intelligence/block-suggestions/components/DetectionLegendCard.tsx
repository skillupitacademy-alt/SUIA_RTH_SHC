'use client';

import React from 'react';
import { ShieldCheck, CircleDot, AlertTriangle } from 'lucide-react';

export function DetectionLegendCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <h3 className="text-xs font-bold text-slate-900 mb-3.5">
        Detection Legend
      </h3>

      <div className="space-y-2.5 text-xs">
        {/* High Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-emerald-700">High Confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-700">≥ 80%</span>
            <span className="text-slate-400 text-[11px]">Very accurate detection</span>
          </div>
        </div>

        {/* Medium Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-amber-700">Medium Confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-700">50% – 79%</span>
            <span className="text-slate-400 text-[11px]">Review recommended</span>
          </div>
        </div>

        {/* Low Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-semibold text-rose-700">Low Confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-700">&lt; 50%</span>
            <span className="text-slate-400 text-[11px]">Manual review suggested</span>
          </div>
        </div>
      </div>
    </div>
  );
}
