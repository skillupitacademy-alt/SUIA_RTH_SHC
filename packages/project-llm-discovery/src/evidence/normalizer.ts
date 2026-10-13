import type { Evidence } from '../contracts/evidence.js';

/**
 * Normalize evidence records by sorting, deduplicating, and validating
 * 
 * M2.1 changes:
 * - Sort by evidenceId (deterministic) instead of path + timestamp
 * - Throw error on duplicate evidenceId (not silent drop)
 */
export function normalizeEvidence(evidence: Evidence[]): Evidence[] {
  // Validate required fields
  for (const e of evidence) {
    if (!e.evidenceId) {
      throw new Error('Evidence missing required field: evidenceId');
    }
    if (!e.path) {
      throw new Error(`Evidence ${e.evidenceId} missing required field: path`);
    }
    if (!e.kind) {
      throw new Error(`Evidence ${e.evidenceId} missing required field: kind`);
    }
    if (!e.claim) {
      throw new Error(`Evidence ${e.evidenceId} missing required field: claim`);
    }
    if (!e.lifecycle) {
      throw new Error(`Evidence ${e.evidenceId} missing required field: lifecycle`);
    }
  }

  // Sort by evidenceId for deterministic ordering (not timestamp-dependent)
  const sorted = [...evidence].sort((a, b) => a.evidenceId.localeCompare(b.evidenceId));

  // Detect duplicate evidenceIds (error, not silent drop)
  const seen = new Set<string>();
  const deduplicated: Evidence[] = [];
  
  for (const e of sorted) {
    if (seen.has(e.evidenceId)) {
      throw new Error(
        `Duplicate evidenceId detected: ${e.evidenceId} (path: ${e.path}, kind: ${e.kind}). ` +
        `Evidence IDs must be unique within a snapshot.`
      );
    }
    seen.add(e.evidenceId);
    deduplicated.push(e);
  }

  return deduplicated;
}
