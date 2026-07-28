"use client";

import React from 'react';
import { Box } from 'lucide-react';

interface ComponentDetailsTabProps {
  // Add props as needed
}

export function ComponentDetailsTab(props: ComponentDetailsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm p-16 flex flex-col items-center justify-center text-center xl:col-span-12">
          <Box size={48} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Component Details</h2>
          <p className="text-sm text-slate-500 max-w-md">
            Detailed component configuration and metadata. Use the new Visual Styling tab for design customization.
          </p>
        </div>
      </div>
    </div>
  );
}
