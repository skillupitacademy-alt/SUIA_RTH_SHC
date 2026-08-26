/**
 * Tutorial Navigation Nodes Hook
 * 
 * Phase 1: Fetches navigation nodes for selected subtopic
 * Maps sidebar navigation structure to Composer-compatible format
 */

import { useEffect, useState } from 'react';

export interface NavigationNode {
  id: string;        // navigationNodeId
  name: string;      // Display name
  type: string;      // 'page' or 'group'
  slug: string;      // URL slug
}

interface UseTutorialNavigationNodesResult {
  navigationNodes: NavigationNode[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches navigation nodes for a given subtopic
 * Returns only nodes belonging to the selected curriculum hierarchy
 * 
 * @param subtopicId - Selected subtopic UUID
 * @param brandId - Brand identifier
 * @returns Navigation nodes, loading state, and error state
 */
export function useTutorialNavigationNodes(
  subtopicId: string | undefined,
  brandId: string
): UseTutorialNavigationNodesResult {
  const [navigationNodes, setNavigationNodes] = useState<NavigationNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subtopicId) {
      setNavigationNodes([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    // Fetch navigation nodes for this subtopic
    fetch(`/api/tutorial-left-sidebar/navigation-nodes?subtopicId=${subtopicId}&brandId=${brandId}`, {
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load navigation nodes: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Expected response: { nodes: NavigationNode[] }
        const nodes = data.nodes || [];
        setNavigationNodes(nodes);
        setIsLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          // Request was aborted (user changed selection)
          return;
        }
        setError(err.message);
        setNavigationNodes([]);
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [subtopicId, brandId]);

  return {
    navigationNodes,
    isLoading,
    error,
  };
}
