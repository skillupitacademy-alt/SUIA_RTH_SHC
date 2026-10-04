/**
 * Project LLM Corpus Registry
 * 
 * Defines the architectural taxonomy of educational block families
 * separate from runtime implementation status.
 */

import { ProjectLlmLifecycleStatus } from './lifecycle';

/**
 * Architectural corpus taxonomy — separate from runtime implementation status
 */
export interface ProjectLlmCorpusStatus {
  /** Total educational block families in architectural taxonomy */
  readonly families: 18;
  /** Total documented versions across all families in the reference corpus */
  readonly documentedVersions: 133;
}

export interface BlockFamilyReference {
  /** Single-letter (or short) family identifier, e.g. "I", "C", "D" */
  familyId: string;
  /** Human-readable family name, e.g. "Introduction" */
  familyName: string;
  /** List of documented version IDs for this family, e.g. ["I1","I2","I3","I4","I5","I6"] */
  documentedVersions: string[];
  /** Lifecycle status of this family in the corpus */
  lifecycleStatus: ProjectLlmLifecycleStatus;
  /** Whether this family has at least one verified runtime implementation */
  hasVerifiedImplementation: boolean;
}

export interface ProjectLlmCorpusRegistry {
  readonly status: ProjectLlmCorpusStatus;
  /** All 18 educational block families */
  families: BlockFamilyReference[];
  /** Source documentation paths (relative to repo root) */
  documentationSources: string[];
}

/** Compile-time constants for corpus counts */
export const CORPUS_FAMILIES_TOTAL = 18 as const;
export const CORPUS_VERSIONS_TOTAL = 133 as const;
