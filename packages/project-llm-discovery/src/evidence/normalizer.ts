import type { Evidence } from '../contracts/evidence.js';

/**
 * Normalize evidence records by sorting, deduplicating, and validating
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
  }

  // Sort by path, then by timestamp
  const sorted = [...evidence].sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path);
    if (pathCompare !== 0) {
      return pathCompare;
    }
    return a.timestamp.localeCompare(b.timestamp);
  });

  // Deduplicate by evidenceId
  const seen = new Set<string>();
  const deduplicated: Evidence[] = [];
  
  for (const e of sorted) {
    if (!seen.has(e.evidenceId)) {
      seen.add(e.evidenceId);
      deduplicated.push(e);
    }
  }

  return deduplicated;
}
