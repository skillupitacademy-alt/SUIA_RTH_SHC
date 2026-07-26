'use client';

import React from 'react';
import { Boxes } from 'lucide-react';
import { getSurfaceStyle, getUiuxColor, type NotesUiuxContract } from './uiuxContract';

interface KeyComponentsProps {
  data: {
    title: string;
    description?: string;
    components: Array<{
      id: string;
      title: string;
      description: string;
      points?: string[];
    }>;
  };
  themeColor?: string;
  uiux?: NotesUiuxContract;
}

export function KeyComponents({ data, themeColor = '#d03f00', uiux }: KeyComponentsProps) {
  if (!data) return null;
  const primaryColor = getUiuxColor(uiux, 'primary_color', themeColor);

  return (
    <div className="rounded-3xl border border-blue-100 bg-white shadow-xl" style={getSurfaceStyle(uiux, themeColor)}>
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3" style={{ color: primaryColor }}>
          <Boxes size={18} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-950">{data.title}</h3>
          {data.description ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{data.description}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.components.map((component) => (
          <article key={component.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <h4 className="text-base font-black" style={{ color: primaryColor }}>{component.title}</h4>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{component.description}</p>
            {component.points?.length ? (
              <ul className="mt-3 space-y-2">
                {component.points.map((point, index) => (
                  <li key={`${component.id}-${index}`} className="flex gap-2 text-xs font-bold leading-5 text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: primaryColor }} />
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
