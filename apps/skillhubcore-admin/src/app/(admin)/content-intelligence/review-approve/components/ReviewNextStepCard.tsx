'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ReviewNextStepCardProps {
  onOpenComposer: () => void;
}

export function ReviewNextStepCard({ onOpenComposer }: ReviewNextStepCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-7 h-7 rounded-lg bg-pink-50 text-[#f54a8d] flex items-center justify-center shrink-0">
          <Sparkles size={15} />
        </div>
        <h3 className="text-xs font-bold text-slate-900">Next Step</h3>
      </div>

      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Proceed to the Composer to arrange, refine and enrich your content blocks.
      </p>

      <button
        onClick={onOpenComposer}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        <span>Open Composer</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
