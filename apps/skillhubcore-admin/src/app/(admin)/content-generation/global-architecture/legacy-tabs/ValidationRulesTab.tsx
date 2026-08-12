/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
"use client";

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ValidationRulesTabProps {
  // Add props as needed
}

export function ValidationRulesTab(props: ValidationRulesTabProps) {
  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm p-16 flex flex-col items-center justify-center text-center xl:col-span-3">
          <ShieldCheck size={48} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Validation Rules</h2>
          <p className="text-sm text-slate-500 max-w-md">
            Content validation rules and schema enforcement configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
