"use client";

import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  Edit2, 
  CheckCircle2, 
  Circle, 
  Star, 
  Grid, 
  Search,
  RefreshCw 
} from 'lucide-react';
import type { ComponentListItem, DummyContextState } from '../types';

interface ComponentSelectionTabProps {
  sectionId: string;
  sectionLabel: string;
  components: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  dummyContext: DummyContextState;
  onToggleEnabled: (componentId: string, enabled: boolean) => void;
  onUpdatePriority: (componentId: string, priority: 1 | 2 | 3 | 4 | 5) => void;
  onPreviewComponent: (componentId: string) => void;
  onEditComponent: (componentId: string) => void;
  onGenerateDummyData: () => void;
}

// Helper function to format component IDs (defined outside component to avoid re-creation)
const formatComponentId = (id: string) => {
  return id
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function ComponentSelectionTab({
  // sectionId,
  // sectionLabel,
  components,
  dummyContext,
  onToggleEnabled,
  onUpdatePriority,
  onPreviewComponent,
  onEditComponent,
  onGenerateDummyData,
}: ComponentSelectionTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // Transform components into list items
  const componentList = useMemo<ComponentListItem[]>(() => {
    return Object.entries(components).map(([id, config]) => {
      const uiSubcomponents = Array.isArray(config.ui_subcomponents) 
        ? config.ui_subcomponents 
        : [];
      const interactiveElements = Array.isArray(config.interactive_elements)
        ? config.interactive_elements
        : [];
      
      return {
        id,
        label: config.label || formatComponentId(id),
        enabled: config.enabled !== false,
        priority: config.priority || 4,
        required: config.required !== false,
        purpose: config.purpose || 'No purpose defined',
        partCount: uiSubcomponents.length + interactiveElements.length,
        order: config.order || 0,
      };
    }).sort((a, b) => a.order - b.order);
  }, [components]);

  // Filter by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return componentList;
    
    const query = searchQuery.toLowerCase();
    return componentList.filter(comp => 
      comp.label.toLowerCase().includes(query) ||
      comp.purpose.toLowerCase().includes(query) ||
      comp.id.toLowerCase().includes(query)
    );
  }, [componentList, searchQuery]);

  // Count enabled vs disabled
  const stats = useMemo(() => {
    const enabled = componentList.filter(c => c.enabled).length;
    const required = componentList.filter(c => c.required).length;
    return {
      total: componentList.length,
      enabled,
      disabled: componentList.length - enabled,
      required,
    };
  }, [componentList]);

  const renderPriorityStars = (priority: number, componentId: string) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdatePriority(componentId, star as 1 | 2 | 3 | 4 | 5);
            }}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={14}
              className={star <= priority ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Grid size={24} className="text-indigo-600" />
            Component Selection & Preview
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Enable components to show in learner UI. Disabled components won&apos;t appear in UI/UX Architecture.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-center">
              <div className="text-lg font-black text-emerald-600">{stats.enabled}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Enabled</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <div className="text-lg font-black text-rose-600">{stats.disabled}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Disabled</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <div className="text-lg font-black text-blue-600">{stats.total}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Total</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onGenerateDummyData}
            className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-4 py-2 text-sm font-black hover:bg-indigo-100 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Generate Preview
          </button>
        </div>
      </div>

      {/* Preview Context Banner */}
      <div 
        key={`${dummyContext.subject}-${dummyContext.topic}`}
        className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 animate-pulse"
        style={{ animationDuration: '0.5s', animationIterationCount: '1' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-purple-900">Preview Context</h3>
            <p className="text-xs font-semibold text-purple-700 mt-1">
              Components preview with: <span className="font-black">{dummyContext.subject}</span> → {dummyContext.topic} → {dummyContext.subtopic}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
            <Eye size={14} />
            <span>{stats.enabled} components will render</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search components by name, purpose, or ID..."
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Component List */}
      <div className="space-y-3">
        {filteredComponents.map((component, index) => {
          const isSelected = selectedComponentId === component.id;
          const colorScheme = component.enabled
            ? index % 2 === 0
              ? 'from-indigo-50 to-blue-50 border-indigo-200'
              : 'from-emerald-50 to-teal-50 border-emerald-200'
            : 'from-slate-50 to-slate-100 border-slate-200';

          return (
            <div
              key={component.id}
              className={`bg-gradient-to-r ${colorScheme} border rounded-2xl p-5 transition-all ${isSelected ? 'ring-2 ring-indigo-300 shadow-lg' : 'hover:shadow-md'}`}
              onClick={() => setSelectedComponentId(component.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSelectedComponentId(component.id);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Toggle & Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEnabled(component.id, !component.enabled);
                    }}
                    className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                      component.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                        component.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {component.enabled ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <Circle size={18} className="text-slate-400" />
                      )}
                      <h3 className="text-base font-black text-slate-900">{component.label}</h3>
                      {component.required && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                          Required
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                        {component.partCount} parts
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      {component.purpose}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Priority:</span>
                        {renderPriorityStars(component.priority, component.id)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Order: {component.order}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewComponent(component.id);
                    }}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-black hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditComponent(component.id);
                    }}
                    className="bg-white border border-indigo-200 text-indigo-700 rounded-lg px-3 py-2 text-xs font-black hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                </div>
              </div>

              {!component.enabled && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-2">
                    ⚠️ Currently disabled - won&apos;t appear in UI/UX Architecture or learner UI
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredComponents.length === 0 && (
          <div className="text-center py-12">
            <Grid size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No components match your search</p>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-xs font-black uppercase text-blue-900 mb-2">💡 Pro Tip</h4>
        <ul className="text-xs font-semibold text-blue-800 space-y-1.5">
          <li>• <strong>Enable/disable</strong> components to control what appears in UI/UX Architecture</li>
          <li>• <strong>Set priority</strong> (1-5 stars) to indicate learning importance</li>
          <li>• <strong>Preview</strong> shows component with dummy {dummyContext.subject} data</li>
          <li>• <strong>Edit</strong> opens Educational Properties tab for detailed configuration</li>
          <li>• Disabled components are hidden from learners and filtered from UI/UX design</li>
        </ul>
      </div>
    </div>
  );
}
