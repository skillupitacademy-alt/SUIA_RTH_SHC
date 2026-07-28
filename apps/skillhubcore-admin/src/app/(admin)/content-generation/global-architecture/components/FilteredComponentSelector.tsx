"use client";

import React from 'react';
import { CheckCircle2, Info, Eye } from 'lucide-react';

interface FilteredComponentSelectorProps {
  enabledComponents: Array<{
    id: string;
    label: string;
    order: number;
    purpose: string;
  }>;
  totalComponents: number;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string) => void;
  showFilteredWarning?: boolean;
}

export function FilteredComponentSelector({
  enabledComponents,
  totalComponents,
  selectedComponentId,
  onSelectComponent,
  showFilteredWarning = true,
}: FilteredComponentSelectorProps) {
  const disabledCount = totalComponents - enabledComponents.length;

  return (
    <div className="space-y-3">
      {/* Filter Info Banner */}
      {showFilteredWarning && disabledCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900">
              Showing {enabledComponents.length} of {totalComponents} components
            </p>
            <p className="text-xs font-semibold text-blue-700 mt-1">
              {disabledCount} component{disabledCount !== 1 ? 's are' : ' is'} disabled in Educational Architecture and hidden from this list.
              Enable components in Educational Architecture to design them here.
            </p>
          </div>
        </div>
      )}

      {/* Component Selection Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase text-slate-900">
          Select Component to Design
        </h3>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
          <CheckCircle2 size={14} />
          <span>{enabledComponents.length} Enabled</span>
        </div>
      </div>

      {/* Component List */}
      <div className="grid gap-2">
        {enabledComponents.map((component, index) => {
          const isSelected = selectedComponentId === component.id;
          const colorClasses = index % 3 === 0
            ? 'from-indigo-50 to-blue-50 border-indigo-200 hover:border-indigo-300'
            : index % 3 === 1
            ? 'from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300'
            : 'from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300';

          return (
            <button
              key={component.id}
              type="button"
              onClick={() => onSelectComponent(component.id)}
              className={`bg-gradient-to-r ${colorClasses} border rounded-xl p-4 text-left transition-all ${
                isSelected 
                  ? 'ring-2 ring-indigo-400 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isSelected ? (
                      <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <h4 className="text-sm font-black text-slate-900">{component.label}</h4>
                    <span className="text-xs font-bold text-slate-500">#{component.order}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed ml-6">
                    {component.purpose || 'No purpose defined'}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg">
                    <Eye size={12} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-600">ACTIVE</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {enabledComponents.length === 0 && (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
            <CheckCircle2 size={48} className="text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-600 mb-1">No Enabled Components</h4>
            <p className="text-xs font-semibold text-slate-500">
              Enable components in Educational Architecture to design them here
            </p>
          </div>
        )}
      </div>

      {/* Bottom Tip */}
      {enabledComponents.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs font-bold text-indigo-800 flex items-center gap-2">
            <Info size={12} />
            Select a component above to customize its visual styling, colors, spacing, and responsive layouts
          </p>
        </div>
      )}
    </div>
  );
}
