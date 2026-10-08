/**
 * Sidebar Tree Transformation
 * 
 * Transforms normalized navigation nodes by adding system-generated slug and URL.
 * 
 * NOTE: This runs AFTER ID normalization.
 * Input nodes already have canonical IDs.
 */

import type { TutorialNavigationNode } from '@quiz/types';
import type { NormalizedNode, NormalizedTree } from './sidebar-schema';

/**
 * Compact slug generation (used for URLs)
 * 
 * Removes all non-alphanumeric characters and converts to lowercase.
 * 
 * NOTE: This is DIFFERENT from navigation ID normalization.
 * URL slugs use name, not id, for backward compatibility.
 * 
 * @example
 * compactSlug("What Is JavaScript?") → "whatisjavascript"
 */
function compactSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Transform navigation tree by adding slug and URL
 * 
 * Adds system-generated slug and URL to each node.
 * Does NOT add brand, theme, progress, or status (presentation layer concerns).
 * 
 * @param tree - Navigation tree with normalized IDs
 * @param scope - Hierarchy context for URL generation
 * @returns Normalized tree with slug/URL added
 */
export function transformNavigationTree(
  tree: { topics: TutorialNavigationNode[] },
  scope: { 
    domainSlug: string; 
    subjectSlug: string; 
    topicSlug: string;
  }
): NormalizedTree {
  function transformNodes(nodes: TutorialNavigationNode[]): NormalizedNode[] {
    return nodes.map((node) => {
      const canonicalSlug = compactSlug(node.name);
      const isPageNode = node.type === 'page';
      
      const normalizedNode: NormalizedNode = {
        id: node.id,
        name: node.name,
        type: node.type || 'group',
        description: node.description,
        slug: canonicalSlug,
        url: isPageNode 
          ? `/tutorial-v2/${scope.domainSlug}/${scope.subjectSlug}/${scope.topicSlug}/${canonicalSlug}/${node.id}` 
          : undefined,
        icon: node.icon,
        expanded: node.expanded,
        children: node.children ? transformNodes(node.children) : undefined,
      };
      
      return normalizedNode;
    });
  }

  return {
    topics: transformNodes(tree.topics),
  };
}
