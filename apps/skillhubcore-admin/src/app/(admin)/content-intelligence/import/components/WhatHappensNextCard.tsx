'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';

export function WhatHappensNextCard() {
  const steps = [
    'We will analyze your content',
    'Identify sections, lists, code, and key concepts',
    'Suggest the best content blocks',
    'You review and customize in the composer',
  ];

  return (
    <div className="bg-[#fffbeb] rounded-xl border border-amber-200/80 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3.5 text-amber-700">
        <HelpCircle size={16} />
        <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
          What happens next?
        </h3>
      </div>

      <ol className="space-y-2.5">
        {steps.map((step, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs text-amber-900 leading-relaxed font-medium">
            <span className="font-bold text-amber-800 shrink-0">{idx + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
