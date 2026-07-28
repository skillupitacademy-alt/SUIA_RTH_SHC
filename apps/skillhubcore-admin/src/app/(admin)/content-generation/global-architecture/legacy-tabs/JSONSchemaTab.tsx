"use client";

import React from 'react';
import { Code } from 'lucide-react';

interface JSONSchemaTabProps {
  // Add props as needed
}

export function JSONSchemaTab(props: JSONSchemaTabProps) {
  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Code size={48} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">JSON Schema</h2>
          <p className="text-sm text-slate-500 max-w-md">
            View and manage JSON schema definitions for component data structures.
          </p>
        </div>
      </div>
    </div>
  );
}
