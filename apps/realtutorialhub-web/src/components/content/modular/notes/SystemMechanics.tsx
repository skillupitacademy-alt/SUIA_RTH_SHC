'use client';

import React from 'react';
import { Settings } from 'lucide-react';

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
    <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl">
      <div className="mb-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
          <Settings size={20} style={{ color: themeColor }} />
        </div>
        <h3 className="text-2xl font-black tracking-tight text-slate-950">{data.panelTitle}</h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{data.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.mechanics.map((item, idx) => (
          <div key={item.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: themeColor }}>
              {idx + 1}
            </span>
            <h4 className="mt-4 text-base font-black text-slate-950">{item.label}</h4>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
