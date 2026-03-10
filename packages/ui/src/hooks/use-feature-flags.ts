'use client';

import { useState, useEffect } from 'react';
import { FeatureFlag, FeatureFlagsMap } from '@quiz/types';
import { apiClient } from '@quiz/api-client';

/**
 * Hook to consume feature flags in client components.
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlagsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFlags() {
      try {
        // Fetch from the new system/flags endpoint
        const response = await apiClient.client.get<{ flags: FeatureFlagsMap }>('/system/flags');
        if (response && response.flags) {
          setFlags(response.flags);
        }
      } catch (error) {
        console.error('[useFeatureFlags] Failed to fetch flags:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFlags();
  }, []);

  const isEnabled = (flag: FeatureFlag): boolean => {
    return !!flags[flag];
  };

  return {
    flags,
    isEnabled,
    isLoading,
  };
}
