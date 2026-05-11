'use client';

import React from 'react';
import { Settings, Cpu, Zap } from 'lucide-react';

interface SystemMechanicsProps {
  data: {
    panelTitle: string;
    description: string;
    mechanics: Array<{
      id: string;
      label: string;
      detail: string;
      iconName?: string;
    }>;
  };
  themeColor: string;
}

export function SystemMechanics({ data, themeColor }: SystemMechanicsProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
          <Settings size={20} style={{ color: themeColor }} />
        </div>
        <h3 className="text-lg font-bold text-slate-100 tracking-tight">{data.panelTitle}</h3>
      </div>

      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
        {data.description}
      </p>

      <div className="space-y-4">
        {data.mechanics.map((item, idx) => (
          <div key={item.id} className="group relative pl-6 pb-4 last:pb-0">
            {idx !== data.mechanics.length - 1 && (
              <div className="absolute left-1.5 top-5 bottom-0 w-px bg-slate-800 group-hover:bg-slate-700 transition-colors" />
            )}
            <div 
              className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-slate-800 bg-slate-900 transition-all group-hover:scale-125"
              style={{ borderColor: idx % 2 === 0 ? themeColor : 'inherit' }}
            />
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">{item.label}</span>
              <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
