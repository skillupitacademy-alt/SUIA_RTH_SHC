"use client";

import React from 'react';
import { Info } from 'lucide-react';

interface UniversalArchitectureTabProps {
  // Add props as needed when extracting the actual logic
}

export function UniversalArchitectureTab(props: UniversalArchitectureTabProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm p-16 flex flex-col items-center justify-center text-center xl:col-span-12">
        <Info size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Universal Architecture</h2>
        <p className="text-sm text-slate-500 max-w-md">
          This legacy tab content will be migrated. For now, use the new Educational Architecture and UI/UX Architecture tabs.
        </p>
      </div>
    </div>
  );
}
