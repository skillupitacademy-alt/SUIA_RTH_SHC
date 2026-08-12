/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
"use client";

import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';

interface LegacyPromptManagementTabProps {
  // Add props as needed
}

export function LegacyPromptManagementTab(props: LegacyPromptManagementTabProps) {
  return (
    <div className="space-y-6 pb-10">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <AlertCircle size={24} className="text-amber-600 shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-amber-900 mb-2">Legacy Prompt Management</h3>
            <p className="text-sm text-amber-800 mb-4">
              This is the legacy prompt management interface. Please use the new Prompt Management tab for updated features.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center text-center py-12 bg-white rounded-xl border border-amber-100">
          <FileText size={48} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Legacy System</h2>
          <p className="text-sm text-slate-500 max-w-md">
            This tab is deprecated and will be removed in a future version.
          </p>
        </div>
      </div>
    </div>
  );
}
