'use client';

import React from 'react';

import { getTutorialAssetAlt, getTutorialAssetImageSource } from '../shared/tutorialAsset';

interface ArchitectureDiagramProps {
  data: Record<string, unknown> /* eslint-disable-line @typescript-eslint/no-explicit-any */;
  }

export function ArchitectureDiagram({ data }: ArchitectureDiagramProps) {
  if (!data) return null;
  const title = typeof data.title === 'string' ? data.title : 'Architecture Diagram';
  const diagramSource = getTutorialAssetImageSource(data.diagramAsset);
  const diagramAlt = getTutorialAssetAlt(data.diagramAsset, title);

  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>
      {diagramSource ? (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={diagramSource} alt={diagramAlt} className="w-full rounded-xl object-contain" />
        </div>
      ) : (
        <pre className="text-[10px] text-slate-500 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
