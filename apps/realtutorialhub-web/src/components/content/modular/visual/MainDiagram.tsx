'use client';

import React from 'react';
import Image from 'next/image';
import { Maximize2, Share2 } from 'lucide-react';

interface MainDiagramProps {
  data: {
    title: string;
    imageUrl: string;
    altText: string;
    description: string;
    annotations?: { x: number; y: number; text: string }[];
  };
  themeColor: string;
}

export function MainDiagram({ data, themeColor }: MainDiagramProps) {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/20 p-1 shadow-2xl overflow-hidden group">
      <div className="bg-slate-950 rounded-[22px] overflow-hidden">
        {/* Visual Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{data.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{data.description}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors">
              <Share2 size={16} />
            </button>
            <button className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors">
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="relative aspect-[16/9] overflow-hidden bg-[#0a0c14] flex items-center justify-center p-8">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, transparent 70%)' }} />
          
          <Image 
            src={data.imageUrl} 
            alt={data.altText} 
            width={1200}
            height={675}
            className="relative z-10 max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]"
          />

          {/* Annotations Layer */}
          {data.annotations?.map((anno, idx) => (
            <div 
              key={idx}
              className="absolute z-20 pointer-events-none"
              style={{ left: `${anno.x}%`, top: `${anno.y}%` }}
            >
              <div className="relative group/anno">
                <div className="w-4 h-4 rounded-full bg-white animate-ping absolute" />
                <div className="w-4 h-4 rounded-full border-2 border-white relative" style={{ backgroundColor: themeColor }} />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-black whitespace-nowrap shadow-xl opacity-0 group-hover/anno:opacity-100 transition-opacity">
                  {anno.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
