/**
 * Runtime Verification Orchestration UI
 * 
 * Provides controls to trigger runtime verification and displays results.
 * Shows runtime health, process management status, and browser verification.
 * 
 * CRITICAL RULE: All data from real backend calls; no hardcoded mock results.
 */

import React, { useState } from 'react';
import { projectLlmClient } from '../api/projectLlmClient';
import type {
  RuntimeHealthStatus,
  BrowserVerificationStatus,
} from '../types/canonicalWorkflowState';

type RuntimeVerificationPanelProps = {
  workflowId: string;
  runtimeHealth?: RuntimeHealthStatus;
  browserVerification?: BrowserVerificationStatus;
  onVerificationComplete?: () => void;
};

const getResultColor = (result: 'PASS' | 'FAIL' | 'SKIPPED'): string => {
  switch (result) {
    case 'PASS':
      return 'text-green-600';
    case 'FAIL':
      return 'text-red-600';
    case 'SKIPPED':
      return 'text-gray-500';
    default:
      return 'text-gray-400';
  }
};

const getResultIcon = (result: 'PASS' | 'FAIL' | 'SKIPPED'): string => {
  switch (result) {
    case 'PASS':
      return '✓';
    case 'FAIL':
      return '✗';
    case 'SKIPPED':
      return '−';
    default:
      return '?';
  }
};

export const RuntimeVerificationPanel: React.FC<RuntimeVerificationPanelProps> = ({
  workflowId,
  runtimeHealth,
  browserVerification,
  onVerificationComplete,
}) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleTriggerVerification = async () => {
    setIsTriggering(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await projectLlmClient.triggerRuntimeVerification(workflowId);
      
      if (response.triggered) {
        setSuccessMessage('Runtime verification triggered successfully');
        
        // Notify parent to refetch workflow state
        if (onVerificationComplete) {
          onVerificationComplete();
        }
      } else {
        setError('Failed to trigger runtime verification');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unknown error occurred'
      );
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Runtime Verification</h3>

      {/* Trigger Button */}
      <div className="mb-6">
        <button
          onClick={handleTriggerVerification}
          disabled={isTriggering}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isTriggering
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isTriggering ? 'Triggering...' : 'Trigger Runtime Verification'}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            {successMessage}
          </div>
        )}
      </div>

      {/* Runtime Health Status */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Runtime Health Check
        </h4>
        
        {runtimeHealth ? (
          <div className="space-y-2 bg-gray-50 p-3 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span
                className={`text-sm font-semibold ${
                  runtimeHealth.healthy ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {runtimeHealth.healthy ? '✓ Healthy' : '✗ Unhealthy'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Process Status:</span>
              <span className="text-sm font-mono text-gray-800">
                {runtimeHealth.processStatus}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Checked:</span>
              <span className="text-sm text-gray-800">
                {new Date(runtimeHealth.lastChecked).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            No runtime health data available
          </p>
        )}
      </div>

      {/* Browser Verification Status */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Browser Verification
        </h4>
        
        {browserVerification ? (
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Result:</span>
              <span
                className={`text-lg font-bold ${getResultColor(
                  browserVerification.result
                )}`}
              >
                {getResultIcon(browserVerification.result)}{' '}
                {browserVerification.result}
              </span>
            </div>
            
            {browserVerification.detail && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Details:</p>
                <p className="text-sm text-gray-800">
                  {browserVerification.detail}
                </p>
              </div>
            )}
            
            {browserVerification.result === 'SKIPPED' && (
              <p className="text-xs text-gray-500 mt-2 italic">
                Browser verification was skipped (not a failure)
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            No browser verification data available
          </p>
        )}
      </div>
    </div>
  );
};
