'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

export function BlockSuggestionsTip() {
  return (
    <div className="mt-6 rounded-xl border border-pink-100 bg-[#fff0f5] p-3.5 flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-pink-100/80 text-[#f54a8d] flex items-center justify-center shrink-0">
        <Lightbulb size={16} />
      </div>
      <p className="text-xs text-slate-700 font-medium leading-relaxed">
        <strong className="text-slate-900 font-semibold">Tip:</strong> Review medium and low confidence blocks carefully. You can edit, merge, split, or delete any suggestion before adding to the composer.
      </p>
    </div>
  );
}
