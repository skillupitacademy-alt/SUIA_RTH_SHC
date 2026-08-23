import type { TutorialPageContentType } from '@quiz/types';

/**
 * Registry Type Definitions
 * 
 * These types define the structure of the block type and version registry.
 * The registry serves as metadata/capability discovery, not implementation storage.
 */

/**
 * Version-specific metadata within a block type
 */
export interface BlockVersionRegistryEntry {
  /** Internal version ID (e.g., 'v1', 'v2') */
  id: string;
  
  /** Version code displayed to users (e.g., 'C1', 'C2', 'D1') */
  code: string;
  
  /** Human-readable label for the version */
  label: string;
  
  /** Optional description of this version's capabilities */
  description?: string;
  
  /** Function that returns the default/example payload for authoring */
  getDefaultPayload: () => unknown;
}

/**
 * Block type registry entry
 * Each block type (definition, code, summary, etc.) has one registry entry
 */
export interface BlockRegistryEntry {
  /** Block type identifier */
  id: TutorialPageContentType;
  
  /** Human-readable label for the block type */
  label: string;
  
  /** Available versions for this block type */
  versions: BlockVersionRegistryEntry[];
}
