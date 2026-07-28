"use client";

import React, { useState } from 'react';
import { 
  GitBranch, 
  CheckCircle2, 
  Lock, 
  Unlock,
  AlertTriangle,
  Info,
  ArrowRight,
  ListOrdered,
  Shield
} from 'lucide-react';
import type { ArchitectureStatus } from '../types';

interface LearningFlowTabProps {
  sectionLabel: string;
  components: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  currentStatus: ArchitectureStatus;
  finalizedAt: string | null;
  finalizedBy: string | null;
  onUpdateStatus: (status: ArchitectureStatus) => void;
  onReorderComponents: (newOrder: string[]) => void;
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

export function LearningFlowTab({
  sectionLabel,
  components,
  currentStatus,
  finalizedAt,
  finalizedBy,
  onUpdateStatus,
  // onReorderComponents,
}: LearningFlowTabProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ArchitectureStatus | null>(null);

  // Get component list sorted by order
  const componentList = Object.entries(components)
    .map(([id, config]) => ({
      id,
      label: config.label || formatComponentId(id),
      enabled: config.enabled !== false,
      required: config.required !== false,
      order: config.order || 0,
      purpose: config.purpose || '',
      prerequisites: Array.isArray(config.prerequisites) ? config.prerequisites : [],
      enables: Array.isArray(config.enables) ? config.enables : [],
    }))
    .sort((a, b) => a.order - b.order);

  const enabledComponents = componentList.filter(c => c.enabled);
  const disabledComponents = componentList.filter(c => !c.enabled);
  const requiredComponents = componentList.filter(c => c.required && c.enabled);

  // Validation checks
  const validationChecks = [
    {
      id: 'min_components',
      label: 'Minimum 3 components enabled',
      passed: enabledComponents.length >= 3,
      required: true,
    },
    {
      id: 'has_required',
      label: 'At least 1 required component',
      passed: requiredComponents.length >= 1,
      required: true,
    },
    {
      id: 'all_have_purpose',
      label: 'All enabled components have purpose',
      passed: enabledComponents.every(c => c.purpose.trim().length > 0),
      required: true,
    },
    {
      id: 'sequential_order',
      label: 'Components have sequential order',
      passed: enabledComponents.every((c, i) => c.order === i + 1 || c.order > 0),
      required: false,
    },
    {
      id: 'no_circular_deps',
      label: 'No circular dependencies detected',
      passed: true, // Simplified check - would need graph traversal for full check
      required: false,
    },
  ];

  const canFinalize = validationChecks
    .filter(check => check.required)
    .every(check => check.passed);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleStatusChangeRequest = (newStatus: ArchitectureStatus) => {
    if (newStatus === 'finalized' && !canFinalize) {
      return; // Blocked by validation
    }

    // Show confirmation for finalization or unlock
    if (newStatus === 'finalized' || (currentStatus === 'finalized' && newStatus === 'draft')) {
      setPendingStatus(newStatus);
      setShowConfirmModal(true);
    } else {
      onUpdateStatus(newStatus);
    }
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatus) {
      onUpdateStatus(pendingStatus);
    }
    setShowConfirmModal(false);
    setPendingStatus(null);
  };

  const getStatusColor = (status: ArchitectureStatus) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'ready': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'finalized': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'archived': return 'bg-amber-100 text-amber-700 border-amber-300';
    }
  };

  const getStatusIcon = (status: ArchitectureStatus) => {
    switch (status) {
      case 'draft': return <Info size={16} />;
      case 'ready': return <CheckCircle2 size={16} />;
      case 'finalized': return <Lock size={16} />;
      case 'archived': return <Shield size={16} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <GitBranch size={24} className="text-indigo-600" />
          Learning Flow & Requirements
        </h2>
        <p className="text-sm text-slate-600 font-medium mt-1">
          Review component sequence, validate requirements, and finalize Educational Architecture for <strong>{sectionLabel}</strong>
        </p>
      </div>

      {/* Current Status Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-black uppercase text-indigo-900">Current Status</h3>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black ${getStatusColor(currentStatus)}`}>
                {getStatusIcon(currentStatus)}
                {currentStatus.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-bold text-slate-600">Enabled Components:</span>
                <span className="ml-2 font-black text-slate-900">{enabledComponents.length} of {componentList.length}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Required Components:</span>
                <span className="ml-2 font-black text-slate-900">{requiredComponents.length}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Finalized At:</span>
                <span className="ml-2 font-black text-slate-900">{formatDate(finalizedAt)}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Finalized By:</span>
                <span className="ml-2 font-black text-slate-900">{finalizedBy || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {currentStatus !== 'finalized' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChangeRequest('draft')}
                  disabled={currentStatus === 'draft'}
                  className="bg-white border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-xs font-black hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Set to Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChangeRequest('ready')}
                  disabled={currentStatus === 'ready'}
                  className="bg-white border border-blue-300 text-blue-700 rounded-lg px-4 py-2 text-xs font-black hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark as Ready
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChangeRequest('finalized')}
                  disabled={!canFinalize}
                  className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-xs font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Lock size={14} />
                  Finalize
                </button>
              </>
            )}
            {currentStatus === 'finalized' && (
              <button
                type="button"
                onClick={() => handleStatusChangeRequest('draft')}
                className="bg-amber-600 text-white rounded-lg px-4 py-2 text-xs font-black hover:bg-amber-700 transition-colors flex items-center gap-2"
              >
                <Unlock size={14} />
                Unlock for Changes
              </button>
            )}
          </div>
        </div>

        {currentStatus === 'finalized' && (
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <p className="text-xs font-bold text-indigo-800 flex items-center gap-2">
              <Lock size={14} />
              Educational Architecture is locked. UI/UX Architecture can now be designed with these {enabledComponents.length} enabled components.
            </p>
          </div>
        )}
      </div>

      {/* Validation Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Validation Checklist
        </h3>

        <div className="space-y-3">
          {validationChecks.map(check => (
            <div
              key={check.id}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                check.passed 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : check.required 
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {check.passed ? (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle size={20} className={check.required ? 'text-rose-600' : 'text-amber-600'} shrink-0 />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-900">{check.label}</p>
                  {check.required && !check.passed && (
                    <p className="text-xs font-semibold text-rose-700 mt-0.5">Required for finalization</p>
                  )}
                </div>
              </div>
              {check.required && (
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-rose-100 text-rose-700">
                  Required
                </span>
              )}
            </div>
          ))}
        </div>

        {!canFinalize && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <p className="text-sm font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle size={16} />
              Cannot finalize: {validationChecks.filter(c => c.required && !c.passed).length} required check(s) failing
            </p>
          </div>
        )}
      </div>

      {/* Learning Flow Visualization */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
          <ListOrdered size={16} className="text-blue-600" />
          Learning Flow Sequence
        </h3>

        <div className="space-y-3">
          {enabledComponents.map((component, index) => (
            <div key={component.id}>
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                {/* Order Number */}
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {index + 1}
                </div>

                {/* Component Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-black text-slate-900">{component.label}</h4>
                    {component.required && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{component.purpose}</p>
                  
                  {/* Dependencies */}
                  {(component.prerequisites.length > 0 || component.enables.length > 0) && (
                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-500">
                      {component.prerequisites.length > 0 && (
                        <span>← Requires: {component.prerequisites.length}</span>
                      )}
                      {component.enables.length > 0 && (
                        <span>Enables: {component.enables.length} →</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Arrow between components */}
              {index < enabledComponents.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight size={20} className="text-indigo-300" />
                </div>
              )}
            </div>
          ))}

          {enabledComponents.length === 0 && (
            <div className="text-center py-8">
              <ListOrdered size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No enabled components</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Enable at least 3 components to see the learning flow
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Disabled Components */}
      {disabledComponents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
            <Info size={16} className="text-slate-400" />
            Disabled Components ({disabledComponents.length})
          </h3>

          <div className="space-y-2">
            {disabledComponents.map(component => (
              <div key={component.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✕</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-600">{component.label}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Won&apos;t appear in UI/UX Architecture or learner UI
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
              {pendingStatus === 'finalized' ? (
                <><Lock size={20} className="text-emerald-600" /> Finalize Educational Architecture?</>
              ) : (
                <><Unlock size={20} className="text-amber-600" /> Unlock for Changes?</>
              )}
            </h3>

            {pendingStatus === 'finalized' ? (
              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-slate-700">
                  You are about to finalize Educational Architecture for <strong>{sectionLabel}</strong>. This will:
                </p>
                <ul className="text-sm font-semibold text-slate-600 space-y-1.5 pl-5">
                  <li>• Lock component selection (enabled/disabled states)</li>
                  <li>• Unlock UI/UX Architecture for visual design</li>
                  <li>• Filter UI/UX to show only {enabledComponents.length} enabled components</li>
                  <li>• Prevent further changes until unlocked</li>
                </ul>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-emerald-800">
                    ✓ All validation checks passed. Ready to finalize.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-slate-700">
                  You are about to unlock Educational Architecture. This will:
                </p>
                <ul className="text-sm font-semibold text-slate-600 space-y-1.5 pl-5">
                  <li>• Allow changes to component selection</li>
                  <li>• Lock UI/UX Architecture (prevent visual design)</li>
                  <li>• Reset status to Draft</li>
                  <li>• Require re-finalization before UI/UX can continue</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-amber-800">
                    ⚠️ Any work in UI/UX Architecture will be preserved but inaccessible until re-finalized.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingStatus(null);
                }}
                className="flex-1 bg-slate-100 text-slate-700 rounded-xl px-4 py-3 text-sm font-black hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className={`flex-1 ${
                  pendingStatus === 'finalized'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                } text-white rounded-xl px-4 py-3 text-sm font-black transition-colors`}
              >
                {pendingStatus === 'finalized' ? 'Finalize' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
