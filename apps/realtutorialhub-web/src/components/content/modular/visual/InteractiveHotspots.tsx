'use client';

import React from 'react';
import { MousePointer2, Info } from 'lucide-react';

interface InteractiveHotspotsProps {
  data: {
    sequenceTitle: string;
    steps: {
      label: string;
      content: string;
      icon?: string;
    }[];
  };
  themeColor: string;
}

export function InteractiveHotspots({ data, themeColor }: InteractiveHotspotsProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <MousePointer2 size={18} className="text-orange-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-100 tracking-tight">{data.sequenceTitle}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.steps.map((step, idx) => (
          <div 
            key={idx}
            className="group relative p-5 rounded-xl border border-slate-800 bg-slate-900/50 transition-all hover:border-slate-700 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded uppercase">Step {idx + 1}</span>
              <Info size={14} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
            </div>
            
            <h4 className="text-sm font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">
              {step.label}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">
              {step.content}
            </p>

            {/* Hover Indicator Line */}
            <div 
              className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
              style={{ backgroundColor: themeColor }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
