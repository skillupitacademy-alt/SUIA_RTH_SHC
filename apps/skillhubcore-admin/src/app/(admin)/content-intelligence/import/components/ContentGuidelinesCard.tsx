'use client';

import React from 'react';
import { Check, ShieldAlert } from 'lucide-react';

export function ContentGuidelinesCard() {
  const guidelines = [
    'You can paste content in any format (plain text, markdown, etc.)',
    'Use headings to indicate sections',
    'Bullet points, numbered lists, and code blocks are supported',
    'Our engine will automatically detect structure and suggest blocks',
    'You can review and modify suggestions in the next step',
  ];

  return (
    <div className="bg-white rounded-xl border border-pink-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3.5 text-pink-600">
        <ShieldAlert size={16} />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Content Guidelines
        </h3>
      </div>

      <ul className="space-y-2.5">
        {guidelines.map((text, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
            <Check size={14} className="text-pink-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
