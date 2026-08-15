'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

export function ImportTip() {
  return (
    <div className="mt-5 p-4 rounded-xl bg-[#eff6ff] border border-blue-200/80 flex items-start gap-3.5 shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb size={18} />
      </div>

      <div className="text-xs text-slate-700 leading-relaxed">
        <strong className="font-bold text-slate-900">Tip: For best results: </strong>
        Use clear headings (<code className="bg-blue-100/70 px-1 py-0.5 rounded text-blue-900 font-mono text-[11px]"># ## ###</code>), bullet points (<code className="bg-blue-100/70 px-1 py-0.5 rounded text-blue-900 font-mono text-[11px]">- or *</code>), and code blocks (<code className="bg-blue-100/70 px-1 py-0.5 rounded text-blue-900 font-mono text-[11px]">```</code>) in your content.
      </div>
    </div>
  );
}
