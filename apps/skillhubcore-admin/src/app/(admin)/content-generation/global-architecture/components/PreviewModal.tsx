"use client";

import React from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { ContractAwareComponentPreview } from '../../../tools/content-manager/components/ContractAwareComponentPreview';
import { getDefaultPipelineJson } from '../utils';

interface ComponentArchitecture {
  purpose?: string;
  required?: boolean;
  renderer?: string;
  style_variant?: string;
  animation_type?: string;
  interactive_elements?: string[];
  enabled?: boolean;
  [key: string]: unknown;
}

interface DummyContextState {
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
  subtopicId: string;
}

interface PreviewModalProps {
  isOpen: boolean;
  componentId: string;
  canonicalSectionId: string;
  activeComponentMap: Record<string, ComponentArchitecture>;
  uiuxData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  dummyContext: DummyContextState;
  onClose: () => void;
  onEditProperties: (componentId: string) => void;
}

export function PreviewModal({
  isOpen,
  componentId,
  canonicalSectionId,
  activeComponentMap,
  uiuxData,
  dummyContext,
  onClose,
  onEditProperties,
}: PreviewModalProps) {
  if (!isOpen || !componentId) return null;

  const componentData = activeComponentMap[componentId];
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Fullscreen Header */}
      <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            title="Close Preview"
          >
            ✕
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Eye size={24} className="text-indigo-600" />
              Component Preview
            </h2>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              {componentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onEditProperties(componentId);
              onClose();
            }}
            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-black hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Edit2 size={14} />
            Edit Properties
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-indigo-600 text-white rounded-lg px-6 py-2 text-sm font-black hover:bg-indigo-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
      
      {/* Fullscreen Body - Split Layout */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Component Info */}
        <div className="w-80 border-r border-slate-200 bg-slate-50 overflow-y-auto p-6 space-y-4 shrink-0">
          {/* Preview Context */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="text-sm font-black text-purple-900 mb-2">Preview Context</h3>
            <p className="text-xs font-semibold text-purple-700">
              <strong>{dummyContext.subject}</strong> → {dummyContext.topic} → {dummyContext.subtopic}
            </p>
          </div>
          
          {/* Component Data */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-black text-slate-900 mb-3">Component Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-bold text-slate-600">Enabled:</span>
                <span className={`font-black ${(componentData?.enabled !== false) ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(componentData?.enabled !== false) ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-bold text-slate-600">Required:</span>
                <span className={`font-black ${componentData?.required ? 'text-rose-600' : 'text-slate-600'}`}>
                  {componentData?.required ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-bold text-slate-600">Renderer:</span>
                <span className="font-mono text-xs text-slate-900">
                  {componentData?.renderer || 'default'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-bold text-slate-600">Style:</span>
                <span className="font-mono text-xs text-slate-900">
                  {String(componentData?.style_variant || 'default')}
                </span>
              </div>
            </div>
            
            {componentData?.purpose && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-600 text-xs">Purpose:</span>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {String(componentData.purpose)}
                </p>
              </div>
            )}
          </div>
          
          {/* Interactive Elements */}
          {Array.isArray(componentData?.interactive_elements) && 
           (componentData.interactive_elements as string[]).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-black text-blue-900 mb-2">Interactive Elements</h3>
              <div className="flex flex-wrap gap-2">
                {(componentData.interactive_elements as string[]).map((element) => (
                  <span
                    key={element}
                    className="bg-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1 rounded-full"
                  >
                    {element}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Main Area - Visual Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100">
          <div className="min-h-full p-8">
            <div className="max-w-5xl mx-auto">
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl px-6 py-4 mb-6">
                <h3 className="text-base font-black text-indigo-900 flex items-center gap-2 mb-1">
                  <Eye size={18} />
                  Live Component Rendering
                </h3>
                <p className="text-sm font-semibold text-indigo-700">
                  Showing how this component renders with {dummyContext.subject} content
                </p>
              </div>
              
              {/* Component Preview */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="p-8">
                  {(() => {
                    const uiuxComponentData = uiuxData?.component_design_system?.[componentId];
                    const previewContent = getDefaultPipelineJson(
                      String(canonicalSectionId),
                      componentId,
                      dummyContext.subtopic
                    );
                    
                    return (
                      <ContractAwareComponentPreview
                        section={String(canonicalSectionId)}
                        subsection={componentId}
                        data={previewContent}
                        contract={uiuxComponentData || componentData || {}}
                        showDiagnostics={false}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
