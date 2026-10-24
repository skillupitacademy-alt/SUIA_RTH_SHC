/**
 * useRepositoryIntelligence Hook (Phase 1, Task 1.2)
 *
 * React hook that provides live repository intelligence data
 * to Project LLM UI pages. Replaces direct imports of the static
 * fixture with real-time data from the discovery scanner output.
 *
 * Usage:
 *   const { intelligence, isLoading, error, refetch } = useRepositoryIntelligence();
 *
 * Falls back to the static fixture if the backend is unreachable,
 * ensuring the UI always has data to display.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProjectLlmRepositoryIntelligence } from '@quiz/types';
import { fetchLiveIntelligence } from '../discoveryAdapter';
import { PROJECT_LLM_REPOSITORY_INTELLIGENCE } from '../projectLlmRepositoryIntelligence';

interface UseRepositoryIntelligenceResult {
  /** The repository intelligence data (live or fallback) */
  intelligence: ProjectLlmRepositoryIntelligence;
  /** Whether the live data is currently loading */
  isLoading: boolean;
  /** Error message if live fetch failed (null means live data is active) */
  error: string | null;
  /** Whether the data comes from the live scanner (true) or static fixture (false) */
  isLive: boolean;
  /** Re-fetch live data from the backend */
  refetch: () => void;
}

export function useRepositoryIntelligence(): UseRepositoryIntelligenceResult {
  const [intelligence, setIntelligence] =
    useState<ProjectLlmRepositoryIntelligence>(
      PROJECT_LLM_REPOSITORY_INTELLIGENCE
    );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const liveData = await fetchLiveIntelligence();
      setIntelligence(liveData);
      setIsLive(true);
    } catch (err) {
      // Fall back to static fixture — UI remains functional
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch live repository data'
      );
      setIntelligence(PROJECT_LLM_REPOSITORY_INTELLIGENCE);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    intelligence,
    isLoading,
    error,
    isLive,
    refetch: fetchData,
  };
}
