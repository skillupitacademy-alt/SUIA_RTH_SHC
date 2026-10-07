/**
 * React hook for fetching CanonicalWorkflowState from backend.
 * 
 * Fetches real workflow state from the backend; never returns fabricated data.
 * Provides loading and error states for proper UI feedback.
 */

import { useState, useEffect, useCallback } from 'react';
import { projectLlmClient } from '../api/projectLlmClient';
import type { CanonicalWorkflowState } from '../types/canonicalWorkflowState';

export type UseWorkflowStateResult = {
  state: CanonicalWorkflowState | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useWorkflowState(workflowId: string): UseWorkflowStateResult {
  const [state, setState] = useState<CanonicalWorkflowState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchWorkflowState = async () => {
      if (!workflowId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const workflowState = await projectLlmClient.getWorkflowState(workflowId);
        
        if (!isCancelled) {
          setState(workflowState);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      }
    };

    fetchWorkflowState();

    return () => {
      isCancelled = true;
    };
  }, [workflowId, refetchTrigger]);

  return {
    state,
    isLoading,
    error,
    refetch,
  };
}
