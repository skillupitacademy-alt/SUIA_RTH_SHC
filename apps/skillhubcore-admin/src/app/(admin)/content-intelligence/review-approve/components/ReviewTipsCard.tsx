'use client';

import React from 'react';
import { Lightbulb, Check } from 'lucide-react';

export function ReviewTipsCard() {
  const tips = [
    'You can reorder blocks in the composer',
    'All content is auto-saved',
    'You can change layouts at any time',
    'Review quality before publishing',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={15} className="text-[#f54a8d]" />
        <h3 className="text-xs font-bold text-slate-900">Tips</h3>
      </div>

      <div className="space-y-2.5">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
            <span className="text-[#f54a8d] font-bold mt-0.5">✓</span>
            <span className="leading-snug">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
