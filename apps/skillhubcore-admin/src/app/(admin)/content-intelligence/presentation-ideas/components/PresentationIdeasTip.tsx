'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

export function PresentationIdeasTip() {
  return (
    <div className="bg-pink-50/70 border border-pink-100 rounded-xl p-4 flex items-center gap-3 mt-6 shadow-2xs">
      <div className="w-8 h-8 rounded-lg bg-pink-100/80 text-[#f54a8d] flex items-center justify-center shrink-0">
        <Lightbulb size={16} />
      </div>
      <p className="text-xs text-slate-700 font-medium">
        <strong className="text-[#f54a8d] font-bold mr-1">Tip:</strong>
        Select ideas and apply them in the composer. You can always change layouts later.
      </p>
    </div>
  );
}
