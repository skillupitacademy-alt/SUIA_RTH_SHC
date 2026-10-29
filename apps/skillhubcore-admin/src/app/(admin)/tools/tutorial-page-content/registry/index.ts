import type { TutorialPageContentType } from '@quiz/types';
import type { BlockRegistryEntry, BlockVersionRegistryEntry } from './types';
import { definitionRegistry } from './entries/definition.registry';
import { codeRegistry } from './entries/code.registry';
import { summaryRegistry } from './entries/summary.registry';
import { introductionRegistry } from './entries/introduction.registry';
import { objectiveRegistry } from './entries/objective.registry';
import { GENERATED_BLOCK_REGISTRIES } from './generatedBlockRegistries';

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
  const staticRegistries = [
    definitionRegistry,
    codeRegistry,
    summaryRegistry,
    introductionRegistry,
    objectiveRegistry,
  ];

  // A generated version may extend an existing family or introduce a new one.
  // Merge by family so the selector never displays duplicate family choices.
  const registriesById = new Map<string, BlockRegistryEntry>();
  for (const entry of [...staticRegistries, ...GENERATED_BLOCK_REGISTRIES]) {
    const existing = registriesById.get(entry.id);
    if (!existing) {
      registriesById.set(entry.id, { ...entry, versions: [...entry.versions] });
      continue;
    }

    const versionCodes = new Set(existing.versions.map((version) => version.code));
    registriesById.set(entry.id, {
      ...existing,
      versions: [
        ...existing.versions,
        ...entry.versions.filter((version) => !versionCodes.has(version.code)),
      ],
    });
  }

  return [...registriesById.values()];
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
    const version = versions.find(v => v.id === versionId || v.code.toUpperCase() === versionId.toUpperCase());
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
