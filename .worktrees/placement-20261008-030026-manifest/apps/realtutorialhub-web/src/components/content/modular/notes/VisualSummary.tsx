'use client';

import React from 'react';
import { Eye, Info } from 'lucide-react';
import { getSurfaceStyle, getUiuxColor, type NotesUiuxContract } from './uiuxContract';

import { getTutorialAssetAlt, getTutorialAssetCaption, getTutorialAssetImageSource } from '../shared/tutorialAsset';

interface VisualSummaryProps {
  data: {
    summaryTitle: string;
    conceptDiagramDescription: string;
    keyTakeaways: string[];
    image?: unknown;
  };
  themeColor: string;
  uiux?: NotesUiuxContract;
}

export function VisualSummary({ data, themeColor, uiux }: VisualSummaryProps) {
  if (!data) return null;
  const primaryColor = getUiuxColor(uiux, 'primary_color', themeColor);
  const imageSource = getTutorialAssetImageSource(data.image);
  const imageAlt = getTutorialAssetAlt(data.image, `${data.summaryTitle} visual summary`);
  const imageCaption = getTutorialAssetCaption(data.image);

  return (
    <div className="rounded-3xl border border-blue-100 bg-white shadow-xl" style={getSurfaceStyle(uiux, themeColor)}>
      <div className="mb-6 flex items-center gap-3">
        <Eye size={20} style={{ color: primaryColor }} />
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{data.summaryTitle}</h3>
      </div>

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info size={14} style={{ color: primaryColor }} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Concept Flow</span>
            </div>
            <p className="text-sm font-semibold leading-6 text-slate-600">
              {data.conceptDiagramDescription}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Core Takeaways</h4>
            <ul className="space-y-2">
              {data.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm font-bold leading-6 text-slate-700">
                  <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ backgroundColor: primaryColor }}>
                    {idx + 1}
                  </span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {imageSource ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r opacity-20 blur transition-opacity group-hover:opacity-30" style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, #fb923c)` }} />
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSource}
                alt={imageAlt}
                className="h-auto w-full object-cover"
              />
              {imageCaption && (
                <div className="absolute bottom-0 left-0 right-0 border-t border-blue-100 bg-white/90 p-3 text-[10px] font-bold text-slate-600 backdrop-blur-sm">
                  {imageCaption}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Visual Placeholder</span>
          </div>
        )}
      </div>
    </div>
  );
}
