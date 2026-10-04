/**
 * Project LLM Repository Intelligence
 * 
 * Agent D contract surface for repository intelligence and reference patterns.
 */

import { BlockFamilyReference, ProjectLlmCorpusRegistry } from './corpus';
import { BlockVersionImplementationStatus, ProjectLlmRuntimeRegistry } from './runtime';

export interface ImplementationPrimitive {
  name: string; // e.g. "heading", "paragraph", "list"
  description: string;
}

export interface ProjectLlmRepositoryIntelligence {
  /** Corpus taxonomy — architectural vocabulary, NOT runtime status */
  corpus: ProjectLlmCorpusRegistry;
  /** Runtime implementation status — separate from corpus taxonomy */
  runtime: ProjectLlmRuntimeRegistry;
  /** Implementation building blocks (15 primitives) — NOT educational families */
  primitives: {
    readonly count: 15;
    list: ImplementationPrimitive[];
    readonly description: 'Implementation building blocks, NOT educational families';
  };
  /** Reference implementation patterns (I1/C1/D1 as models) */
  referencePatterns: ReferenceImplementationPattern[];
  /** Source document paths confirming these values */
  sourceDocuments: string[];
}

export interface ReferenceImplementationPattern {
  versionId: string; // 'I1' | 'C1' | 'D1'
  familyId: string;
  familyName: string;
  lifecycleStatus: 'RUNTIME_INTEGRATED';
  ubrcCompliance: 'FULL';
  keyFiles: string[];
  description: string;
}

export interface S1WarningRecord {
  versionId: 'S1';
  familyId: 'S';
  familyName: 'Summary';
  reason: 'Missing S-type version enforcement — not a reference-quality implementation';
  lifecycleStatus: 'IMPLEMENTED';
  ubrcCompliance: 'PARTIAL';
}
