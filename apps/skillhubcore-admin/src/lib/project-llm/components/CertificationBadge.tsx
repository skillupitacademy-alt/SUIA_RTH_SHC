/**
 * Certification Badge Component
 * 
 * Displays the certification lifecycle: CERTIFICATION_READY → Human Gate 2 → CERTIFIED
 * Shows gate results: UBRC, brand, theme, registry, renderer, evidence
 * Shows runtime and browser verification status
 * 
 * CRITICAL RULE: NEVER displays fabricated PASS status.
 * All data sourced from real backend responses only.
 */

import React from 'react';
import type {
  CertificationStatus,
  CertificationGateResult,
  CanonicalWorkflowStateEnum,
} from '../types/canonicalWorkflowState';

type CertificationBadgeProps = {
  certification?: CertificationStatus;
  isLoading?: boolean;
};

const getStateLabel = (state: CanonicalWorkflowStateEnum): string => {
  switch (state) {
    case 'CERTIFICATION_READY':
      return 'Ready for Certification';
    case 'AWAITING_GATE_2':
      return 'Awaiting Human Gate 2';
    case 'CERTIFIED':
      return 'Certified';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Pre-Certification';
  }
};

const getResultBadgeColor = (result: 'PASS' | 'FAIL' | 'SKIPPED' | 'PENDING'): string => {
  switch (result) {
    case 'PASS':
      return 'bg-green-100 text-green-800';
    case 'FAIL':
      return 'bg-red-100 text-red-800';
    case 'SKIPPED':
      return 'bg-gray-100 text-gray-600';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getStateColor = (state: CanonicalWorkflowStateEnum): string => {
  switch (state) {
    case 'CERTIFIED':
      return 'bg-green-500 text-white';
    case 'REJECTED':
      return 'bg-red-500 text-white';
    case 'CERTIFICATION_READY':
    case 'AWAITING_GATE_2':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const GateResultItem: React.FC<{ gate: CertificationGateResult }> = ({ gate }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
    <span className="text-sm font-medium text-gray-700">{gate.gate}</span>
    <div className="flex items-center gap-2">
      <span
        className={`px-2 py-1 text-xs font-semibold rounded ${getResultBadgeColor(
          gate.result
        )}`}
      >
        {gate.result}
      </span>
      {gate.detail && (
        <span className="text-xs text-gray-500" title={gate.detail}>
          ℹ️
        </span>
      )}
    </div>
  </div>
);

export const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  certification,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        <p>No certification data available</p>
        <p className="text-xs mt-2">
          Certification status will appear here once the workflow progresses.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 ${getStateColor(certification.state)}`}>
        <h3 className="text-lg font-semibold">
          {getStateLabel(certification.state)}
        </h3>
        {certification.certifiedAt && (
          <p className="text-sm opacity-90 mt-1">
            Certified: {new Date(certification.certifiedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Gate Results */}
      <div className="p-4">
        {certification.gates.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Certification Gates
            </h4>
            {certification.gates.map((gate, index) => (
              <GateResultItem key={`${gate.gate}-${index}`} gate={gate} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No gate results available yet
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Workflow ID: <span className="font-mono">{certification.workflowId}</span>
        </p>
      </div>
    </div>
  );
};
