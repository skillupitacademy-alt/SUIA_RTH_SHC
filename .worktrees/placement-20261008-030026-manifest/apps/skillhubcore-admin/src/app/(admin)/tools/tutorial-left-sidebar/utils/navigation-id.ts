/**
 * Navigation ID Utilities - Phase 0
 * Stable ID governance for tutorial navigation pages
 * 
 * PURPOSE:
 * - Normalize navigation node IDs to canonical format
 * - Validate ID uniqueness
 * - Safety fallback for missing IDs
 * 
 * SCOPE (Phase 0 only):
 * - Sidebar navigation JSON authoring
 * - ID normalization and validation
 * - NO database identity bridge
 * - NO page→subtopic mapping
 * - NO TutorialDB changes
 */

import type { TutorialNavigationNode } from '@quiz/types';
import type { AuthoringNavigationNode } from '../../../../api/tutorial-left-sidebar/sidebar-schema';

/**
 * Normalize a raw ID/name string to canonical format
 * 
 * Canonical format: lowercase alphanumeric characters ONLY
 * - Remove all non-alphanumeric characters (spaces, hyphens, punctuation, etc.)
 * - No hyphens, no underscores, no spaces
 * - Deterministic and readable
 * 
 * @example
 * normalizeNavigationId("What Is JavaScript?")
 * → "whatisjavascript"
 * 
 * normalizeNavigationId("JavaScript_Fundamentals")
 * → "javascriptfundamentals"
 * 
 * normalizeNavigationId("Let vs Var vs Const")
 * → "letvsvarvsconst"
 */
export function normalizeNavigationId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Get canonical ID for a navigation node
 * 
 * PRIMARY: Use node.id if provided
 * FALLBACK: Generate from node.name (safety net only)
 * 
 * NOTE: External AI instructions require every node to have id.
 * The fallback is for safety, not normal authoring.
 * 
 * @example
 * getCanonicalNavigationId({ id: "intro", name: "Introduction" })
 * → "intro"
 * 
 * getCanonicalNavigationId({ name: "What Is JavaScript?" })
 * → "whatisjavascript"
 */
export function getCanonicalNavigationId(
  node: AuthoringNavigationNode
): string {
  const rawId = typeof node.id === 'string' ? node.id.trim() : '';
  
  return normalizeNavigationId(rawId || node.name);
}

/**
 * Validate that all navigation IDs are unique after normalization
 * 
 * Traverses entire tree and detects duplicate canonical IDs.
 * Throws descriptive error if duplicates found.
 * 
 * @throws Error if duplicate canonical IDs detected
 * 
 * @example
 * const nodes = [
 *   { id: "intro", name: "Introduction", type: "page" },
 *   { id: "Intro", name: "Intro Page", type: "page" }
 * ];
 * validateUniqueCanonicalNavigationIds(nodes);
 * // → throws "Duplicate navigation ID after normalization: intro"
 */
export function validateUniqueCanonicalNavigationIds(
  nodes: AuthoringNavigationNode[]
): void {
  const seen = new Map<string, string>();

  function walk(
    currentNodes: AuthoringNavigationNode[],
    path: string
  ): void {
    for (const node of currentNodes) {
      const canonicalId = getCanonicalNavigationId(node);
      const currentPath = `${path} → ${node.name}`;

      if (!canonicalId) {
        throw new Error(
          `Navigation node "${node.name}" at ${currentPath} cannot produce a valid ID. ` +
          `Please provide a valid name or explicit ID.`
        );
      }

      const previousPath = seen.get(canonicalId);

      if (previousPath) {
        throw new Error(
          `Duplicate navigation ID after normalization: "${canonicalId}"\n\n` +
          `First occurrence: ${previousPath}\n` +
          `Second occurrence: ${currentPath}\n\n` +
          `Please provide unique IDs for these navigation nodes.`
        );
      }

      seen.set(canonicalId, currentPath);

      if (node.children?.length) {
        walk(node.children, currentPath);
      }
    }
  }

  walk(nodes, 'Root');
}

/**
 * Normalize all IDs in navigation tree
 * 
 * Applies canonical ID normalization to entire tree.
 * Preserves original name and description, only normalizes id field.
 * 
 * NOTE: This is applied server-side before storage.
 * 
 * @example
 * const nodes = [
 *   { 
 *     id: "What_Is_JS", 
 *     name: "What Is JavaScript?", 
 *     type: "page",
 *     description: "Introduces JavaScript basics."
 *   }
 * ];
 * const normalized = normalizeNavigationIds(nodes);
 * // → [{ 
 * //     id: "whatisjs", 
 * //     name: "What Is JavaScript?", 
 * //     type: "page",
 * //     description: "Introduces JavaScript basics."
 * //   }]
 */
export function normalizeNavigationIds(
  nodes: AuthoringNavigationNode[]
): TutorialNavigationNode[] {
  function normalizeNode(node: AuthoringNavigationNode): TutorialNavigationNode {
    const normalized: TutorialNavigationNode = {
      id: getCanonicalNavigationId(node),
      name: node.name,
      type: node.type,
    };

    // Preserve optional authoring fields if present
    if (node.description) {
      normalized.description = node.description;
    }
    if (node.icon) {
      normalized.icon = node.icon;
    }
    if (node.expanded !== undefined) {
      normalized.expanded = node.expanded;
    }

    // Recursively normalize children
    if (node.children && node.children.length > 0) {
      normalized.children = normalizeNavigationIds(node.children);
    }

    return normalized;
  }

  return nodes.map(normalizeNode);
}
