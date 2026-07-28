"use client";

import React from 'react';
import { ListOrdered } from 'lucide-react';

interface SectionSequenceTabProps {
  // Add props as needed
}

export function SectionSequenceTab(props: SectionSequenceTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <ListOrdered size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Section Sequence</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Component sequence and ordering configuration. This tab is being migrated to the new architecture.
        </p>
      </div>
    </div>
  );
}
