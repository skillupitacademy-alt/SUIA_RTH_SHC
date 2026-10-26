import type { BlockRegistryEntry } from './types';

/**
 * Append-only Composer registry surface owned by Project LLM placement.
 *
 * Static product families stay in entries/. Approved external blocks are added
 * here as hash-bound operations, avoiding edits to registry/index.ts.
 */
export const GENERATED_BLOCK_REGISTRIES: readonly BlockRegistryEntry[] = [
  // PROJECT_LLM_GENERATED_REGISTRIES
];
