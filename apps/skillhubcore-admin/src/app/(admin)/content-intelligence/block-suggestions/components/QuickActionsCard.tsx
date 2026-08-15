'use client';

import React from 'react';
import { RotateCw, Trash2 } from 'lucide-react';

interface QuickActionsCardProps {
  onRegenerate?: () => void;
  onRejectAll?: () => void;
}

export function QuickActionsCard({
  onRegenerate,
  onRejectAll,
}: QuickActionsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <h3 className="text-xs font-bold text-slate-900 mb-3.5">
        Quick Actions
      </h3>

      <div className="space-y-2.5">
        <button
          onClick={onRegenerate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RotateCw size={14} className="text-slate-500" />
          <span>Regenerate Suggestions</span>
        </button>

        <button
          onClick={onRejectAll}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Trash2 size={14} className="text-rose-500" />
          <span>Reject All</span>
        </button>
      </div>
    </div>
  );
}
