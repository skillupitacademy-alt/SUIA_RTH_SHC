import type { TutorialPageContentType } from '@quiz/types';
import type { BlockRegistryEntry, BlockVersionRegistryEntry } from './types';
import { definitionRegistry } from './entries/definition.registry';
import { codeRegistry } from './entries/code.registry';
import { summaryRegistry } from './entries/summary.registry';

/**
 * Block Registry Public API
 * 
 * This module provides the canonical interface for querying block types and versions.
 * Components should use these functions instead of directly accessing registry data.
 */

/**
 * Get all registered block types
 */
export function getBlockTypes(): BlockRegistryEntry[] {
  return [
    definitionRegistry,
    codeRegistry,
    summaryRegistry,
  ];
}

/**
 * Get a specific block type by ID
 */
export function getBlockType(blockTypeId: TutorialPageContentType): BlockRegistryEntry | undefined {
  return getBlockTypes().find(b => b.id === blockTypeId);
}

/**
 * Get all versions for a specific block type
 */
export function getVersions(blockTypeId: TutorialPageContentType): BlockVersionRegistryEntry[] {
  const blockType = getBlockType(blockTypeId);
  return blockType?.versions ?? [];
}

/**
 * Get a specific version by block type and version code
 */
export function getVersion(
  blockTypeId: TutorialPageContentType,
  versionCode: string
): BlockVersionRegistryEntry | undefined {
  const versions = getVersions(blockTypeId);
  return versions.find(v => v.code === versionCode);
}

/**
 * Get default payload for a specific block type
 * Falls back to first version if no specific version provided
 */
export function getDefaultPayload(
  blockTypeId: TutorialPageContentType,
  versionId?: string
): unknown {
  const versions = getVersions(blockTypeId);
  
  if (versionId) {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      return version.getDefaultPayload();
    }
  }
  
  // Fallback to first version
  const firstVersion = versions[0];
  return firstVersion?.getDefaultPayload() ?? {};
}

// Re-export types for convenience
export type { BlockRegistryEntry, BlockVersionRegistryEntry } from './types';
