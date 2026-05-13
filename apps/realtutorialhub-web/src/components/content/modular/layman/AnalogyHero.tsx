'use client';

import React from 'react';
import { ArrowRight, Lightbulb, LibraryBig, MonitorCog } from 'lucide-react';

import { getTutorialAssetAlt, getTutorialAssetImageSource } from '../shared/tutorialAsset';

interface AnalogyHeroProps {
  data: {
    title: string;
    storyAnalogy: string;
    comparisonPanel: {
      realWorld: string;
      technical: string;
    };
    visualMetaphor: string;
    keyTakeaway: string;
    image?: unknown;
  };
  themeColor: string;
  sectionNumber?: number;
}

export function AnalogyHero({ data, themeColor, sectionNumber = 2 }: AnalogyHeroProps) {
  if (!data) return null;
  const imageSource = getTutorialAssetImageSource(data.image);
  const imageAlt = getTutorialAssetAlt(data.image, `${data.title} illustration`);

  return (
    <section className="rounded-[28px] border border-emerald-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-lg font-black text-white">
          {sectionNumber}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{data.title}</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${themeColor}14`, color: themeColor }}
            >
              <LibraryBig size={22} />
            </div>
            <p className="text-base font-semibold leading-7 text-slate-800">{data.storyAnalogy}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Visual Metaphor</div>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{data.visualMetaphor}</p>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 shrink-0 text-violet-700" size={18} />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Key Takeaway</div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{data.keyTakeaway}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          {imageSource ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageSource}
              alt={imageAlt}
              className="mb-5 h-40 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="mb-5 flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
              <MonitorCog size={40} className="text-slate-400" />
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Real World</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-blue-950">{data.comparisonPanel.realWorld}</p>
            </div>

            <div className="flex justify-center">
              <ArrowRight size={22} className="text-slate-400" />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Technical Meaning</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">{data.comparisonPanel.technical}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
