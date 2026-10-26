import type { TutorialPageContentType } from '@quiz/types';
import type { TutorialPromptContext } from '../prompts/tutorialPromptContext';

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

  /** Optional version-owned AI prompt generator. Generic guidance is used when omitted. */
  getAiPrompt?: (context: TutorialPromptContext) => string;

  /** Optional version-owned authoring rules shown alongside AI guidance. */
  authoringRules?: readonly string[];
}

/**
 * Block type registry entry
 * Each block type (definition, code, summary, etc.) has one registry entry
 */
export interface BlockRegistryEntry {
  /** Block type identifier */
  id: TutorialPageContentType | string;
  
  /** Human-readable label for the block type */
  label: string;
  
  /** Available versions for this block type */
  versions: BlockVersionRegistryEntry[];
}
