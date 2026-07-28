"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Target, 
  CheckSquare, 
  GitBranch, 
  Save,
  AlertCircle,
  Star
} from 'lucide-react';
import type { ComponentPriority } from '../types';

interface EducationalPropertiesTabProps {
  componentId: string | null;
  componentLabel: string;
  componentConfig: {
    enabled: boolean;
    required: boolean;
    priority: ComponentPriority;
    purpose: string;
    learning_objective: string;
    content_requirements: string[];
    prerequisites: string[];
    enables: string[];
  } | null;
  availableComponents: Array<{ id: string; label: string }>;
  onSave: (componentId: string, config: Partial<any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function EducationalPropertiesTab({
  componentId,
  componentLabel,
  componentConfig,
  availableComponents,
  onSave,
}: EducationalPropertiesTabProps) {
  const [formState, setFormState] = useState({
    enabled: true,
    required: false,
    priority: 4 as ComponentPriority,
    purpose: '',
    learning_objective: '',
    content_requirements: [] as string[],
    prerequisites: [] as string[],
    enables: [] as string[],
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load component config into form state
  useEffect(() => {
    if (componentConfig) {
      setFormState({
        enabled: componentConfig.enabled,
        required: componentConfig.required,
        priority: componentConfig.priority,
        purpose: componentConfig.purpose || '',
        learning_objective: componentConfig.learning_objective || '',
        content_requirements: componentConfig.content_requirements || [],
        prerequisites: componentConfig.prerequisites || [],
        enables: componentConfig.enables || [],
      });
      setHasChanges(false);
    }
  }, [componentConfig, componentId]);

  const handleFieldChange = (field: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setFormState(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddRequirement = () => {
    if (!newRequirement.trim()) return;
    
    const updated = [...formState.content_requirements, newRequirement.trim()];
    setFormState(prev => ({ ...prev, content_requirements: updated }));
    setNewRequirement('');
    setHasChanges(true);
  };

  const handleRemoveRequirement = (index: number) => {
    const updated = formState.content_requirements.filter((_, i) => i !== index);
    setFormState(prev => ({ ...prev, content_requirements: updated }));
    setHasChanges(true);
  };

  const handleTogglePrerequisite = (compId: string) => {
    const updated = formState.prerequisites.includes(compId)
      ? formState.prerequisites.filter(id => id !== compId)
      : [...formState.prerequisites, compId];
    setFormState(prev => ({ ...prev, prerequisites: updated }));
    setHasChanges(true);
  };

  const handleToggleEnables = (compId: string) => {
    const updated = formState.enables.includes(compId)
      ? formState.enables.filter(id => id !== compId)
      : [...formState.enables, compId];
    setFormState(prev => ({ ...prev, enables: updated }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!componentId) return;
    
    onSave(componentId, formState);
    setHasChanges(false);
  };

  if (!componentId || !componentConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BookOpen size={64} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-black text-slate-400 mb-2">No Component Selected</h3>
        <p className="text-sm font-semibold text-slate-500">
          Select a component from the Universal Architecture tab to edit its educational properties.
        </p>
      </div>
    );
  }

  const otherComponents = availableComponents.filter(c => c.id !== componentId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" />
            Educational Properties
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Configure learning-specific properties for <strong>{componentLabel}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          Save Config
        </button>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm font-bold text-amber-800">
            You have unsaved changes. Click &quot;Save Config&quot; to apply your changes.
          </p>
        </div>
      )}

      {/* Component Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
          <CheckSquare size={16} className="text-indigo-600" />
          Component Status
        </h3>
        
        <div className="space-y-4">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="enabled-toggle" className="text-sm font-bold text-slate-700">Enabled</label>
              <p className="text-xs text-slate-500 font-medium">Show this component in UI/UX Architecture and learner UI</p>
            </div>
            <button
              id="enabled-toggle"
              type="button"
              onClick={() => handleFieldChange('enabled', !formState.enabled)}
              className={`w-14 h-8 rounded-full transition-colors flex items-center ${
                formState.enabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  formState.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Required Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="required-toggle" className="text-sm font-bold text-slate-700">Required</label>
              <p className="text-xs text-slate-500 font-medium">Learners must complete this to progress</p>
            </div>
            <button
              id="required-toggle"
              type="button"
              onClick={() => handleFieldChange('required', !formState.required)}
              className={`w-14 h-8 rounded-full transition-colors flex items-center ${
                formState.required ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  formState.required ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Priority Slider */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Learning Priority: {formState.priority}/5
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleFieldChange('priority', level as ComponentPriority)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={level <= formState.priority ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">
              {formState.priority === 5 && '⭐ Critical - Must learn concept'}
              {formState.priority === 4 && '⭐ High - Very important for understanding'}
              {formState.priority === 3 && '⭐ Medium - Helpful but not essential'}
              {formState.priority === 2 && '⭐ Low - Nice to know'}
              {formState.priority === 1 && '⭐ Minimal - Optional enrichment'}
            </p>
          </div>
        </div>
      </div>

      {/* Learning Purpose */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
          <Target size={16} className="text-purple-600" />
          Learning Purpose
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="purpose" className="block text-sm font-bold text-slate-700 mb-2">
              Purpose
            </label>
            <textarea
              id="purpose"
              value={formState.purpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              rows={3}
              placeholder="What does this component teach? (e.g., Hero introduction with quick-look navigation pills)"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          <div>
            <label htmlFor="learning_objective" className="block text-sm font-bold text-slate-700 mb-2">
              Learning Objective
            </label>
            <textarea
              id="learning_objective"
              value={formState.learning_objective}
              onChange={(e) => handleFieldChange('learning_objective', e.target.value)}
              rows={3}
              placeholder="What should learners be able to do after this? (e.g., Help learners understand the concept at a glance before diving into details)"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Content Requirements */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
          <CheckSquare size={16} className="text-emerald-600" />
          Content Requirements
        </h3>

        <div className="space-y-3 mb-4">
          {formState.content_requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <CheckSquare size={16} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 flex-1">{req}</span>
              <button
                type="button"
                onClick={() => handleRemoveRequirement(index)}
                className="text-rose-600 hover:text-rose-700 text-xs font-bold"
              >
                Remove
              </button>
            </div>
          ))}

          {formState.content_requirements.length === 0 && (
            <p className="text-sm font-semibold text-slate-400 text-center py-4">
              No content requirements defined. Add your first requirement below.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRequirement();
              }
            }}
            placeholder="e.g., Must have: Hero title"
            className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={handleAddRequirement}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Prerequisites & Dependencies */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
          <GitBranch size={16} className="text-blue-600" />
          Prerequisites & Dependencies
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Prerequisites */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">Requires (Prerequisites)</h4>
            <p className="text-xs text-slate-500 font-medium mb-3">
              Components that must be completed before this one
            </p>
            {otherComponents.length > 0 ? (
              <div className="space-y-2">
                {otherComponents.map((comp) => (
                  <label
                    key={comp.id}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formState.prerequisites.includes(comp.id)}
                      onChange={() => handleTogglePrerequisite(comp.id)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">{comp.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-400">No other components available</p>
            )}
          </div>

          {/* Enables */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">Enables (Dependencies)</h4>
            <p className="text-xs text-slate-500 font-medium mb-3">
              Components that unlock after this one is completed
            </p>
            {otherComponents.length > 0 ? (
              <div className="space-y-2">
                {otherComponents.map((comp) => (
                  <label
                    key={comp.id}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formState.enables.includes(comp.id)}
                      onChange={() => handleToggleEnables(comp.id)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">{comp.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-400">No other components available</p>
            )}
          </div>
        </div>

        {(formState.prerequisites.length > 0 || formState.enables.length > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-bold text-blue-700">
              📊 Flow: {formState.prerequisites.length} → <strong>{componentLabel}</strong> → {formState.enables.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
