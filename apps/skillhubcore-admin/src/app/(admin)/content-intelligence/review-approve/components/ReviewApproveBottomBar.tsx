'use client';

import React from 'react';
import { Info, Save } from 'lucide-react';

interface ReviewApproveBottomBarProps {
  onSaveReview: () => void;
}

export function ReviewApproveBottomBar({ onSaveReview }: ReviewApproveBottomBarProps) {
  return (
    <div className="bg-[#0B1B3D]/5 border border-[#0B1B3D]/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#0B1B3D] text-white flex items-center justify-center shrink-0">
          <Info size={15} />
        </div>
        <p className="text-xs text-slate-700 font-medium">
          Only accepted and modified suggestions will be added to the composer. You can change layout and components anytime later.
        </p>
      </div>

      <button
        onClick={onSaveReview}
        className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#0B1B3D] hover:bg-[#152a56] text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
      >
        <Save size={14} />
        <span>Save Review</span>
      </button>
    </div>
  );
}
